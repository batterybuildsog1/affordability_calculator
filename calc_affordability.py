
# Constants
FHA_RATE = 0.0615  # 6.15%
CONV_RATE = 0.0645 # 6.45%
DTI_LIMIT = 0.45
FHA_LIMIT = 680000
TAX_INS_HOA_RATE = 0.012 

# Products
products = {
    'Apartments': {'type': 'Rent', 'range': (1700, 4500)},
    'Condos': {'type': 'Buy', 'range': (450000, 650000)},
    'Blackridge': {'type': 'Buy', 'range': (620000, 680000)},
    'Townhouse': {'type': 'Buy', 'range': (1100000, 2100000)},
}

# Segments for busybusy / AlignOps based on search
roles = [
    {'role': 'SDR/BDR', 'base': 40000, 'ote': 65000, 'count': 25}, 
    {'role': 'Client Success', 'base': 50000, 'ote': 60000, 'count': 20},
    {'role': 'AE (Mid-Market)', 'base': 55000, 'ote': 130000, 'count': 30},
    {'role': 'Director/VP', 'base': 130000, 'ote': 180000, 'count': 15},
    {'role': 'Exec/C-Suite', 'base': 200000, 'ote': 250000, 'count': 5},
    {'role': 'Ops/Admin/Eng', 'base': 80000, 'ote': 90000, 'count': 12} 
]

def calc_max_price(annual_income, rate, dti, down_payment_pct):
    monthly_gross = annual_income / 12
    max_monthly_payment = monthly_gross * dti
    
    r_monthly = rate / 12
    n_months = 360
    
    mortgage_factor = (r_monthly * (1 + r_monthly)**n_months) / ((1 + r_monthly)**n_months - 1)
    denominator = (1 - down_payment_pct) * mortgage_factor + (TAX_INS_HOA_RATE / 12)
    
    max_price = max_monthly_payment / denominator
    return max_price

header = "{:<20} | {:<20} | {:<10} | {:<12} | {:<20}".format("Role", "Scenario", "Income", "Max Price", "Affordable")
print(header)
print('-'*100)

for r in roles:
    scenarios = [
        {'name': 'Single (Base)', 'income': r['base']},
        {'name': 'Single (OTE)', 'income': r['ote']},
        {'name': 'Dual Income (+60k)', 'income': r['ote'] + 60000}
    ]
    
    for s in scenarios:
        price = calc_max_price(s['income'], FHA_RATE, DTI_LIMIT, 0.035)
        
        if price > FHA_LIMIT:
            price = calc_max_price(s['income'], CONV_RATE, DTI_LIMIT, 0.10)
            
        matches = []
        for p_name, p_data in products.items():
            if p_data['type'] == 'Buy':
                if price >= p_data['range'][0]:
                    matches.append(p_name)
            else:
                if (s['income'] / 12) * 0.35 >= p_data['range'][0]:
                     matches.append(p_name) # Removed (Rent) suffix for brevity

        row = "{:<20} | {:<20} | ${:<9} | ${:<11} | {}".format(
            r['role'], s['name'], s['income'], int(price), ', '.join(matches)
        )
        print(row)

