#!/usr/bin/env python3
"""
Script will extract the daily data from onthesnow.com, reformat into a readable format, \
then merge the daily ski report with a set csv that has the rest of the information for \
each of the ski resorts on it. It will return the dataframe that houses that info.

Author: Shayon Keating
Date: February 11, 2024
"""

# import reqs
import requests
from bs4 import BeautifulSoup
import csv
import pandas as pd
import os
import time

# constants that should not change
ski_resort_url = "https://www.onthesnow.com/skireport"
file_path = 'backend/resort_info.csv'
output_directory = os.getenv('GITHUB_WORKSPACE', '.') + '/frontend/schnar_map/public/data'
output_file_name = 'daily_ski.csv'
output_file_path = os.path.join(output_directory, output_file_name)


def scrape_ski_resorts(url):
    """
    Scrapes through url for ski information and returns a DataFrame
    
    Args: need to be the url from onthesnow.com
    
    Returns: ski resort information or error to the webpage
    """
    response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=10)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, 'html.parser')
    resorts_list = []
    # table columns: Base | Lifts Open | Runs Open | 3 Day Snowfall | 3 Day Snow Forecast
    for row in soup.select("table tbody tr"):
        name = row.find("th", scope="row")
        cells = [td.get_text(strip=True) for td in row.find_all("td")]
        if not name or not name.a or len(cells) < 4:
            continue
        base, lifts, runs, snowfall = cells[:4]
        resorts_list.append([name.a.get_text(strip=True), snowfall, base, runs, lifts])
    if not resorts_list:
        raise RuntimeError(f"No resorts found at {url}, page layout probably changed again")
    return pd.DataFrame(resorts_list, columns=['Resort Name', '72 Hour Snowfall', 'Base Depth', 'Trails open', 'Open lifts'])


def reformat_ski(df, column_names = None):
    """
    Reformats the ski data into a readable format and elimates fluff from web scrape

    Args: input from scrape_ski_resorts

    Returns: apropriately reshaped dataframe that is read for merging and loading
    """
    reshaped_df = df.copy()
    for col in ['72 Hour Snowfall', 'Base Depth', 'Trails open', 'Open lifts']:
        reshaped_df[col] = reshaped_df[col].str.replace(r'\s*/.*', '', regex=True).replace('-', '')
    reshaped_df['Resort Name'] = reshaped_df['Resort Name'].str.replace(r'Ski Area', '', regex=True)
    reshaped_df['Resort Name'] = reshaped_df['Resort Name'].str.replace(r'Resort', '', regex=True)
    reshaped_df['Resort Name'] = reshaped_df['Resort Name'].str.replace(r'Mountain', '', regex=True)
    return reshaped_df


def match_locations(df1, df2):
    """
    Merges the daily update information with the resort information
    
    Args: df1 is the daily ski report and df2 is the ski_locations
    
    Returns: merged df ready to be loaded to website
    """
    df1['Resort Name'] = df1['Resort Name'].str.strip()
    df2['Resort Name'] = df2['Resort Name'].str.strip()
    merged_daily = pd.merge(df1, df2, on='Resort Name', how='inner')
    merged_daily = merged_daily.head(20)
    return merged_daily


def main():
    """Main function."""
    # Ensure the output directory exists
    if not os.path.exists(output_directory):
        os.makedirs(output_directory)

    # Delete the existing CSV file if it exists
    if os.path.exists(output_file_path):
        os.remove(output_file_path)
    
    # After deleting previous file adding a delay for security
    time.sleep(1)
    
    daily_ski_report = scrape_ski_resorts(ski_resort_url)
    ski_report = reformat_ski(daily_ski_report)
    ski_locations = pd.read_csv(file_path)
    load_ski = match_locations(ski_report, ski_locations)
    load_ski.to_csv(output_file_path, index=False)


if __name__ == "__main__":
    main()
    
