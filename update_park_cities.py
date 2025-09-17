#!/usr/bin/env python3
"""
Update park city names from 'Various' to actual city locations
based on East Bay Regional Parks data.
"""

import json

# Park city mappings based on EBRP official data
park_cities = {
    "Anthony Chabot Regional Park": "Castro Valley",
    "Antioch/Oakley Regional Shoreline": "Antioch",
    "Ardenwood Historic Farm": "Fremont",
    "Bay Point Regional Shoreline": "Bay Point",
    "Big Break Regional Shoreline": "Oakley",
    "Bishop Ranch Open Space Regional Preserve": "San Ramon",
    "Black Diamond Mines Regional Preserve": "Antioch",
    "Briones Regional Park": "Lafayette",
    "Brooks Island Regional Preserve": "Richmond",
    "Browns Island": "Pittsburg",
    "Brushy Peak Regional Preserve": "Livermore",
    "Carquinez Strait Regional Shoreline": "Martinez",
    "Castle Rock Regional Recreation Area": "Walnut Creek",
    "Tilden (Charles Lee Tilden) Regional Park": "Berkeley",
    "Claremont Canyon Regional Preserve": "Berkeley",
    "Contra Loma Regional Park": "Antioch",
    "Coyote Hills Regional Park": "Fremont",
    "Crockett Hills Regional Park": "Crockett",
    "Cull Canyon Regional Recreation Area": "Castro Valley",
    "Deer Valley Regional Park": "Antioch",
    "Del Valle Regional Park": "Livermore",
    "Diablo Foothills Regional Park": "Walnut Creek",
    "Don Castro Regional Recreation Area": "Hayward",
    "Redwood (Dr. Aurelia Reinhardt Redwood) Regional Park": "Oakland",
    "Dublin Hills Regional Park": "Dublin",
    "Dumbarton Quarry Campground on the Bay": "Fremont",
    "Five Canyons Open Space": "Castro Valley",
    "Garin Regional Park": "Hayward",
    "Dry Creek Pioneer Regional Park": "Fremont",
    "Hayward Regional Shoreline": "Hayward",
    "Huckleberry Botanic Regional Preserve": "Oakland",
    "Judge John Sutter Regional Shoreline": "Antioch",
    "Kennedy Grove Regional Recreation Area": "El Sobrante",
    "Lake Chabot Regional Park": "Castro Valley",
    "Las Trampas Wilderness Regional Preserve": "San Ramon",
    "Leona Canyon Regional Open Space Preserve": "Oakland",
    "Little Hills Regional Recreation Area": "San Pablo",
    "Martin Luther King Jr. Regional Shoreline": "Oakland",
    "McLaughlin Eastshore State Park": "Berkeley",
    "Miller/Knox Regional Shoreline": "Richmond",
    "Mission Peak Regional Preserve": "Fremont",
    "Morgan Territory Regional Preserve": "Clayton",
    "Ohlone Wilderness Regional Preserve": "Fremont",
    "Oyster Bay Regional Shoreline": "San Leandro",
    "Pleasanton Ridge Regional Park": "Pleasanton",
    "Point Isabel Regional Shoreline": "Richmond",
    "Point Pinole Regional Shoreline": "Richmond",
    "Quarry Lakes Regional Recreation Area": "Fremont",
    "Robert W. Crown Memorial State Beach": "Alameda",
    "Roberts Regional Recreation Area": "Oakland",
    "Round Valley Regional Preserve": "Brentwood",
    "Shadow Cliffs Regional Recreation Area": "Pleasanton",
    "Sibley Volcanic Regional Preserve": "Oakland",
    "Sobrante Ridge Regional Preserve": "El Sobrante",
    "Sunol Wilderness Regional Preserve": "Sunol",
    "Sycamore Valley Open Space Regional Preserve": "Danville",
    "Ted and Kathy Radke Martinez Regional Shoreline": "Martinez",
    "Temescal Regional Recreation Area": "Oakland",
    "Thurgood Marshall Regional Park": "Berkeley",
    "Tilden Nature Area": "Berkeley",
    "Tilden Regional Parks Botanic Garden": "Berkeley",
    "Vargas Plateau Regional Park": "Fremont",
    "Vasco Caves Regional Preserve": "Brentwood",
    "Waterbird Regional Preserve": "Antioch",
    "Wildcat Canyon Regional Park": "Richmond"
}

def update_park_cities():
    # Load current parks data
    with open('parks-data.js', 'r') as f:
        content = f.read()

    # Extract the parks array from the JavaScript file
    start = content.find('[')
    end = content.rfind(']') + 1
    parks_json = content[start:end]

    # Parse the parks data
    parks_data = json.loads(parks_json)

    # Update cities
    updated_count = 0
    for park in parks_data:
        park_name = park['name']
        if park_name in park_cities:
            old_city = park['city']
            new_city = park_cities[park_name]
            if old_city != new_city:
                park['city'] = new_city
                updated_count += 1
                print(f"Updated {park_name}: {old_city} → {new_city}")
        else:
            print(f"WARNING: No city mapping found for: {park_name}")

    # Write updated parks data back to file
    updated_content = content[:start] + json.dumps(parks_data, indent=4) + content[end:]

    with open('parks-data.js', 'w') as f:
        f.write(updated_content)

    print(f"\nUpdated {updated_count} park cities successfully!")

if __name__ == '__main__':
    update_park_cities()