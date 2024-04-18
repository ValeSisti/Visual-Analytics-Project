from operator import index
import pandas as pd
import numpy as np

############ LINE CHART ############
df_clust = pd.read_csv('Project/src/dataset/players_22.csv')
df_clust = df_clust.loc[(df_clust['league_name'] == "French Ligue 1") | (df_clust['league_name'] == "Italian Serie A") | (df_clust['league_name'] == "English Premier League") | (df_clust['league_name'] == "Spain Primera Division") | (df_clust['league_name'] == "German 1. Bundesliga")]
df_clust.reset_index(drop=True, inplace=True)
df_clust = df_clust.rename(columns=({'player_positions': 'Positions'}))
df_clust['Positions'] = df_clust.Positions.str.split(',').str[0]
df_clust['Positions'] = df_clust['Positions'].replace({'CAM' : 'Midfielder', 'CB' : 'Defender', 'CDM' : 'Midfielder', 'CM' : 'Midfielder', 'LAM' : 'Midfielder', 'LB' : 'Defender', 'LCB' : 'Defender', 'LCM' : 'Midfielder', 'LDM' : 'Midfielder', 'LF' : 'Forward', 'LM' : 'Midfielder', 'LS' : 'Forward', 'LW' : 'Midfielder', 'LWB' : 'Defender', 'RAM' : 'Midfielder', 'RB' : 'Defender', 'RCB' : 'Defender', 'RCM' : 'Midfielder', 'RDM' : 'Midfielder', 'RF' : 'Forward', 'RM' : 'Midfielder', 'RS' : 'Forward', 'RW' : 'Midfielder', 'RWB' : 'Defender', 'ST' : 'Forward', 'GK' : 'Goalkeeper', 'CF' : 'Forward'})
csv_clust = df_clust.to_csv('Project/src/dataset/players_22_filtered_data.csv', index=False)

############ PARALLEL COORDINATES ############
df_parallel_coordinates = pd.read_csv('Project/src/dataset/players_22.csv')
df_parallel_coordinates = df_parallel_coordinates.loc[(df_parallel_coordinates['league_name'] == "French Ligue 1") | (df_parallel_coordinates['league_name'] == "Italian Serie A") | (df_parallel_coordinates['league_name'] == "English Premier League") | (df_parallel_coordinates['league_name'] == "Spain Primera Division") | (df_parallel_coordinates['league_name'] == "German 1. Bundesliga")]
df_parallel_coordinates.reset_index(drop=True, inplace=True)
df_parallel_coordinates = df_parallel_coordinates.filter(['sofifa_id', 'short_name', 'league_name','player_positions','age','overall','potential','wage_eur','value_eur', 'height_cm', 'weight_kg'])
df_parallel_coordinates = df_parallel_coordinates.rename(columns=({'player_positions': 'Positions', 'league_name': 'League', 'age': 'Age', 'overall': 'Overall', 'potential': 'Potential', 'wage_eur': 'Wage (eur)', 'value_eur': 'Value (eur)', 'height_cm': 'Height (cm)', 'weight_kg': 'Weight (kg)'}))
df_parallel_coordinates['Positions'] = df_parallel_coordinates.Positions.str.split(',').str[0]
df_parallel_coordinates['Positions'] = df_parallel_coordinates['Positions'].replace({'CAM' : 'Midfielder', 'CB' : 'Defender', 'CDM' : 'Midfielder', 'CM' : 'Midfielder', 'LAM' : 'Midfielder', 'LB' : 'Defender', 'LCB' : 'Defender', 'LCM' : 'Midfielder', 'LDM' : 'Midfielder', 'LF' : 'Forward', 'LM' : 'Midfielder', 'LS' : 'Forward', 'LW' : 'Midfielder', 'LWB' : 'Defender', 'RAM' : 'Midfielder', 'RB' : 'Defender', 'RCB' : 'Defender', 'RCM' : 'Midfielder', 'RDM' : 'Midfielder', 'RF' : 'Forward', 'RM' : 'Midfielder', 'RS' : 'Forward', 'RW' : 'Midfielder', 'RWB' : 'Defender', 'ST' : 'Forward', 'GK' : 'Goalkeeper', 'CF' : 'Forward'})
csv_parallel_coordinates = df_parallel_coordinates.to_csv('Project/src/dataset/players_22_parallel_coordinates.csv', index=False)

############ LIST ############
df_list = pd.read_csv('Project/src/dataset/players_22.csv')
df_list = df_list.loc[(df_list['league_name'] == "French Ligue 1") | (df_list['league_name'] == "Italian Serie A") | (df_list['league_name'] == "English Premier League") | (df_list['league_name'] == "Spain Primera Division") | (df_list['league_name'] == "German 1. Bundesliga")]
df_list = df_list.rename(columns=({'player_positions': 'Positions'}))
df_list['Positions'] = df_list.Positions.str.split(',').str[0]
df_list['Positions'] = df_list['Positions'].replace({'CAM' : 'Midfielder', 'CB' : 'Defender', 'CDM' : 'Midfielder', 'CM' : 'Midfielder', 'LAM' : 'Midfielder', 'LB' : 'Defender', 'LCB' : 'Defender', 'LCM' : 'Midfielder', 'LDM' : 'Midfielder', 'LF' : 'Forward', 'LM' : 'Midfielder', 'LS' : 'Forward', 'LW' : 'Midfielder', 'LWB' : 'Defender', 'RAM' : 'Midfielder', 'RB' : 'Defender', 'RCB' : 'Defender', 'RCM' : 'Midfielder', 'RDM' : 'Midfielder', 'RF' : 'Forward', 'RM' : 'Midfielder', 'RS' : 'Forward', 'RW' : 'Midfielder', 'RWB' : 'Defender', 'ST' : 'Forward', 'GK' : 'Goalkeeper', 'CF' : 'Forward'})
df_list = df_list.filter(['sofifa_id', 'short_name','player_face_url', 'Positions', 'club_name', 'preferred_foot', 'club_contract_valid_until'])
csv_list = df_list.to_csv('Project/src/dataset/players_22_list.csv', index=False)
