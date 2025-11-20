# -*- coding: utf-8 -*-
"""
Data Validation Script for Techridge Affordability Model

This script validates all company JSON files to ensure they conform to the expected schema
and contain reasonable data. Run this before porting data to Next.js or after making changes.

Usage:
    python validate_data.py
"""

import json
import os
from pathlib import Path
from typing import Dict, List, Tuple


# Expected schema requirements
REQUIRED_COMPANY_FIELDS = ["name", "base_year", "employee_count", "roles"]
REQUIRED_ROLE_FIELDS = ["title", "count", "base_salary", "ote", "is_entry_level", "segment_type", "household_split"]
REQUIRED_HOUSEHOLD_SPLIT_FIELDS = ["H1_single", "H2_dual_moderate", "H3_dual_peer"]

# Validation rules
MIN_BASE_SALARY = 25000
MAX_BASE_SALARY = 500000
MIN_OTE = 25000
MAX_OTE = 1000000


class ValidationError:
    def __init__(self, severity: str, file: str, message: str):
        self.severity = severity  # "ERROR" or "WARNING"
        self.file = file
        self.message = message

    def __str__(self):
        return f"[{self.severity}] {self.file}: {self.message}"


def validate_household_split(split: Dict, role_title: str, filename: str) -> List[ValidationError]:
    """Validate household split percentages."""
    errors = []

    # Check all required fields present
    for field in REQUIRED_HOUSEHOLD_SPLIT_FIELDS:
        if field not in split:
            errors.append(ValidationError(
                "ERROR",
                filename,
                f"Role '{role_title}': Missing household_split field '{field}'"
            ))

    # Check percentages sum to ~1.0 (allowing for rounding)
    total = sum(split.get(field, 0.0) for field in REQUIRED_HOUSEHOLD_SPLIT_FIELDS)
    if abs(total - 1.0) > 0.01:
        errors.append(ValidationError(
            "WARNING",
            filename,
            f"Role '{role_title}': Household split sums to {total:.2f}, expected 1.0"
        ))

    # Check all values are between 0 and 1
    for field, value in split.items():
        if not (0 <= value <= 1):
            errors.append(ValidationError(
                "ERROR",
                filename,
                f"Role '{role_title}': household_split['{field}'] = {value}, must be between 0 and 1"
            ))

    return errors


def validate_role(role: Dict, filename: str) -> List[ValidationError]:
    """Validate a single role segment."""
    errors = []

    # Check required fields
    for field in REQUIRED_ROLE_FIELDS:
        if field not in role:
            errors.append(ValidationError(
                "ERROR",
                filename,
                f"Role missing required field: '{field}'"
            ))
            continue

    role_title = role.get("title", "Unknown")

    # Validate salary ranges
    base_salary = role.get("base_salary")
    ote = role.get("ote")

    if base_salary is not None:
        if base_salary < MIN_BASE_SALARY or base_salary > MAX_BASE_SALARY:
            errors.append(ValidationError(
                "WARNING",
                filename,
                f"Role '{role_title}': base_salary {base_salary} outside expected range ${MIN_BASE_SALARY:,}-${MAX_BASE_SALARY:,}"
            ))

    if ote is not None:
        if ote < MIN_OTE or ote > MAX_OTE:
            errors.append(ValidationError(
                "WARNING",
                filename,
                f"Role '{role_title}': ote {ote} outside expected range ${MIN_OTE:,}-${MAX_OTE:,}"
            ))

    # Validate OTE >= base
    if base_salary is not None and ote is not None:
        if ote < base_salary:
            errors.append(ValidationError(
                "WARNING",
                filename,
                f"Role '{role_title}': OTE (${ote:,}) is less than base_salary (${base_salary:,})"
            ))

    # Validate count
    count = role.get("count")
    if count is not None:
        if count < 0:
            errors.append(ValidationError(
                "ERROR",
                filename,
                f"Role '{role_title}': count cannot be negative ({count})"
            ))
        if count == 0:
            errors.append(ValidationError(
                "WARNING",
                filename,
                f"Role '{role_title}': count is 0 (role may be unused)"
            ))

    # Validate household split
    if "household_split" in role:
        errors.extend(validate_household_split(role["household_split"], role_title, filename))

    return errors


def validate_company(company: Dict, filename: str) -> List[ValidationError]:
    """Validate a single company configuration."""
    errors = []

    # Check required fields
    for field in REQUIRED_COMPANY_FIELDS:
        if field not in company:
            errors.append(ValidationError(
                "ERROR",
                filename,
                f"Company missing required field: '{field}'"
            ))

    company_name = company.get("name", "Unknown")

    # Validate base_year
    base_year = company.get("base_year")
    if base_year is not None:
        if base_year < 2020 or base_year > 2030:
            errors.append(ValidationError(
                "WARNING",
                filename,
                f"{company_name}: base_year {base_year} seems unusual"
            ))

    # Validate employee_count
    employee_count = company.get("employee_count")
    if employee_count is not None:
        if employee_count <= 0:
            errors.append(ValidationError(
                "ERROR",
                filename,
                f"{company_name}: employee_count must be positive ({employee_count})"
            ))

    # Validate roles
    roles = company.get("roles", [])
    if not roles:
        errors.append(ValidationError(
            "WARNING",
            filename,
            f"{company_name}: No roles defined"
        ))

    for role in roles:
        errors.extend(validate_role(role, filename))

    # Check that role counts sum reasonably close to employee_count
    total_role_count = sum(role.get("count", 0) for role in roles)
    if employee_count is not None and total_role_count > 0:
        diff = abs(total_role_count - employee_count)
        if diff > employee_count * 0.1:  # Allow 10% variance
            errors.append(ValidationError(
                "WARNING",
                filename,
                f"{company_name}: Role counts sum to {total_role_count}, but employee_count is {employee_count} (diff: {diff})"
            ))

    # Validate projection_years if present
    if "projection_years" in company:
        projections = company["projection_years"]
        if not isinstance(projections, list):
            errors.append(ValidationError(
                "ERROR",
                filename,
                f"{company_name}: projection_years must be a list"
            ))
        else:
            for i, proj in enumerate(projections):
                if "year" not in proj:
                    errors.append(ValidationError(
                        "ERROR",
                        filename,
                        f"{company_name}: projection_years[{i}] missing 'year' field"
                    ))
                if "employee_count" not in proj:
                    errors.append(ValidationError(
                        "ERROR",
                        filename,
                        f"{company_name}: projection_years[{i}] missing 'employee_count' field"
                    ))

    return errors


def validate_all_companies(data_dir: str = "data") -> Tuple[List[ValidationError], int]:
    """Validate all company JSON files in the data directory."""
    errors = []
    files_checked = 0

    data_path = Path(data_dir)
    if not data_path.exists():
        print(f"Error: Data directory '{data_dir}' does not exist")
        return errors, 0

    for json_file in data_path.glob("*.json"):
        # Skip supply.json - it has a different schema
        if json_file.name == "supply.json":
            continue

        files_checked += 1
        filename = json_file.name

        try:
            with open(json_file, 'r') as f:
                data = json.load(f)
        except json.JSONDecodeError as e:
            errors.append(ValidationError(
                "ERROR",
                filename,
                f"Invalid JSON: {e}"
            ))
            continue
        except Exception as e:
            errors.append(ValidationError(
                "ERROR",
                filename,
                f"Failed to read file: {e}"
            ))
            continue

        # Handle both single company and companies array
        if "companies" in data:
            for i, company in enumerate(data["companies"]):
                errors.extend(validate_company(company, f"{filename}[{i}]"))
        elif "name" in data:
            errors.extend(validate_company(data, filename))
        else:
            errors.append(ValidationError(
                "ERROR",
                filename,
                "File must contain either 'companies' array or single company object with 'name' field"
            ))

    return errors, files_checked


def main():
    print("Techridge Data Validation")
    print("=" * 80)
    print()

    errors, files_checked = validate_all_companies()

    # Separate errors and warnings
    error_list = [e for e in errors if e.severity == "ERROR"]
    warning_list = [e for e in errors if e.severity == "WARNING"]

    # Print results
    print(f"Files checked: {files_checked}")
    print(f"Errors: {len(error_list)}")
    print(f"Warnings: {len(warning_list)}")
    print()

    if error_list:
        print("ERRORS:")
        print("-" * 80)
        for error in error_list:
            print(f"  {error}")
        print()

    if warning_list:
        print("WARNINGS:")
        print("-" * 80)
        for warning in warning_list:
            print(f"  {warning}")
        print()

    if not errors:
        print(" All validation checks passed!")
        return 0
    elif not error_list:
        print("�  Validation completed with warnings")
        return 0
    else:
        print("L Validation failed with errors")
        return 1


if __name__ == "__main__":
    exit(main())
