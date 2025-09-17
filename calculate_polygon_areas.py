#!/usr/bin/env python3
"""
Calculate actual acreage from polygon boundaries in the GeoJSON file
and update the parks data with the computed areas.
"""

import json
import geopandas as gpd
from shapely.geometry import shape

def calculate_park_areas():
    # Load the GeoJSON file
    print("Loading park boundaries...")
    gdf = gpd.read_file('east_bay_parks_boundaries.geojson')

    # Convert to a projected coordinate system for accurate area calculation
    # Using California State Plane Zone III (EPSG:2227) which covers the Bay Area
    print("Converting to projected coordinate system for accurate area calculation...")
    gdf_projected = gdf.to_crs('EPSG:2227')  # California State Plane Zone III (feet)

    # Calculate area in square feet, then convert to acres
    print("Calculating areas...")
    gdf_projected['area_sq_ft'] = gdf_projected.geometry.area
    gdf_projected['area_acres'] = gdf_projected['area_sq_ft'] / 43560  # 1 acre = 43,560 sq ft

    # Group by park name and sum areas for parks with multiple polygons
    park_areas = gdf_projected.groupby('OFFICIAL_NAME')['area_acres'].sum().round(1)

    print(f"\nCalculated areas for {len(park_areas)} parks:")
    print("-" * 50)

    # Load current parks data
    with open('parks-data.js', 'r') as f:
        content = f.read()

    # Extract the parks array from the JavaScript file
    start = content.find('[')
    end = content.rfind(']') + 1
    parks_json = content[start:end]

    # Parse the parks data
    parks_data = json.loads(parks_json)

    # Update areas and collect results
    updated_parks = []
    area_updates = []

    for park in parks_data:
        park_name = park['name']
        old_acres = park['acres']

        if park_name in park_areas:
            new_acres = float(park_areas[park_name])
            park['acres'] = new_acres
            area_updates.append({
                'name': park_name,
                'old_acres': old_acres,
                'new_acres': new_acres,
                'difference': new_acres - old_acres
            })
            print(f"{park_name}: {old_acres} → {new_acres} acres ({new_acres - old_acres:+.1f})")
        else:
            print(f"{park_name}: No polygon data, keeping {old_acres} acres")

        updated_parks.append(park)

    # Write updated parks data back to file
    updated_content = content[:start] + json.dumps(updated_parks, indent=4) + content[end:]

    with open('parks-data.js', 'w') as f:
        f.write(updated_content)

    # Summary statistics
    total_old = sum(update['old_acres'] for update in area_updates)
    total_new = sum(update['new_acres'] for update in area_updates)

    print(f"\nSummary:")
    print(f"Parks with updated areas: {len(area_updates)}")
    print(f"Total old acreage: {total_old:,.1f} acres")
    print(f"Total new acreage: {total_new:,.1f} acres")
    print(f"Net difference: {total_new - total_old:+,.1f} acres")

    # Show biggest changes
    biggest_increases = sorted([u for u in area_updates if u['difference'] > 0],
                              key=lambda x: x['difference'], reverse=True)[:5]
    biggest_decreases = sorted([u for u in area_updates if u['difference'] < 0],
                              key=lambda x: x['difference'])[:5]

    if biggest_increases:
        print(f"\nBiggest increases:")
        for update in biggest_increases:
            print(f"  {update['name']}: +{update['difference']:.1f} acres")

    if biggest_decreases:
        print(f"\nBiggest decreases:")
        for update in biggest_decreases:
            print(f"  {update['name']}: {update['difference']:.1f} acres")

if __name__ == '__main__':
    calculate_park_areas()