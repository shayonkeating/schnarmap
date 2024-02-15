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
output_directory = os.path.join('..', 'frontend', 'schnar_map', 'public', 'data')
output_file_name = 'daily_ski.csv'
output_file_path = os.path.join(output_directory, output_file_name)


def scrape_ski_resorts(url):
    """
    Scrapes through url for ski information and returns a DataFrame
    
    Args: need to be the url from onthesnow.com
    
    Returns: ski resort information or error to the webpage
    """
    try:
        response = requests.get(url, timeout=10)
        resorts_list = []
        
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            resorts = soup.find_all("span", class_="h4 styles_h4__1nbGO")
            
            for resort in resorts:
                resort_name = resort.text.strip() if resort.text else "No Name"
                resorts_list.append([resort_name])
            resorts_df = pd.DataFrame(resorts_list, columns=['Resort Name'])
            
            return resorts_df
        else:
            print(f"Failed to retrieve the webpage, status code: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")


def reformat_ski(df, column_names = None):
    """
    Reformats the ski data into a readable format and elimates fluff from web scrape
    
    Args: input from scrape_ski_resorts
    
    Returns: apropriately reshaped dataframe that is read for merging and loading
    """
    reshaped_data = []
    data_column = df.iloc[:, 0]
    for start in range(0, len(data_column), 5):
        group = data_column[start:start + 5].tolist()
        reshaped_data.append(group)
    reshaped_df = pd.DataFrame(reshaped_data, columns=['Resort Name', '72 Hour Snowfall', 'Base Depth', 'Trails open', 'Open lifts'])
    reshaped_df['72 Hour Snowfall'] = reshaped_df['72 Hour Snowfall'].str.replace("-", "", regex=False)
    reshaped_df['72 Hour Snowfall'] = reshaped_df['72 Hour Snowfall'].str.replace("", "", regex=False)
    reshaped_df['Open lifts'] = reshaped_df['Open lifts'].str.replace("-", "", regex=False)
    reshaped_df['Trails open'] = reshaped_df['Trails open'].str.replace(r'\/\d+.*', '', regex=True)
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
    
