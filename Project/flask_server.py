from flask import Flask, request, jsonify
import pandas as pd
from flask_cors import CORS, cross_origin
import numpy as np
from sklearn.decomposition import PCA
from sklearn import preprocessing, manifold
from sklearn.manifold import TSNE
from sklearn.cluster import KMeans

flask_server = Flask(__name__)
CORS(flask_server)

@flask_server.route('/flask_get', methods=['GET'])
@cross_origin()
def read_file():
    with open('Project/src/selected_position.txt') as f:
        lines = f.read()
    return lines

@flask_server.route('/flask_initial_get', methods=['GET'])
@cross_origin()
def write_file():
    with open('Project/src/selected_position.txt', 'w') as f:
            f.write('Forward,Midfielder,Goalkeeper,Defender')
    return "ok"

@flask_server.route('/flask', methods=['POST'])
@cross_origin()
def index():
    requested_data = request.json['positions']
    requested_clust = request.json['radio']
    print(requested_clust)

    if requested_data == "none":

        #SE SIAMO NELLA SITUAZIONE DI PARTENZA COL DATASET DI PARTENZA, DOBBIAMO FARE LE STESSE COSE MA LEGGENDO IL CSV DI PARTENZA E SALVANDOLO COME CSV DI PARTENZA

        #ALTRIMENTI FACCIAMO QUELLO CHE FACEVAMO PRIMA
        
        df = pd.read_csv('Project/src/dataset/players_22_for_dimensionality_reduction_clust.csv')

        ####################### PCA CLUSTERS #######################
        df_clust_pca = pd.read_csv('Project/src/dataset/players_22_pca.csv')
        df_clust_pca = df_clust_pca.drop(columns=["cluster_pca"], errors='ignore')
        df_clust_pca.drop(df_clust_pca.filter(regex="Unname"),axis=1, inplace=True)
        kmeans_model = KMeans(n_clusters=int(requested_clust))
        kmeans_model.fit(df_clust_pca)
        df_clust_pca["cluster_pca"] = kmeans_model.labels_
        #csv_pca = df_clust_pca.to_csv('Project/src/dataset/players_22_pca.csv')

        ####################### TSNE CLUSTERS #######################
        df_clust_tsne = pd.read_csv('Project/src/dataset/players_22_tsne.csv')
        df_clust_tsne = df_clust_tsne.drop(columns=["cluster_tsne"], errors='ignore')
        df_clust_tsne.drop(df_clust_tsne.filter(regex="Unname"),axis=1, inplace=True)
        kmeans_model = KMeans(n_clusters=int(requested_clust))
        kmeans_model.fit(df_clust_tsne)
        df_clust_tsne["cluster_tsne"] = kmeans_model.labels_
        #csv_tsne = df_clust_tsne.to_csv('Project/src/dataset/players_22_tsne.csv')
        

        #FINAL COMPUTATIONS
        '''df_pca = pd.read_csv('Project/src/dataset/players_22_pca.csv')
        df_tsne = pd.read_csv('Project/src/dataset/players_22_tsne.csv')'''
        df_clust_pca.drop(df_clust_pca.filter(regex="Unname"),axis=1, inplace=True)
        df_clust_tsne.drop(df_clust_tsne.filter(regex="Unname"),axis=1, inplace=True)
        df_full = df.join(df_clust_pca, how="outer").join(df_clust_tsne, how="outer")
        print(df_full)
        df_full = df_full.filter(['sofifa_id', 'short_name', 'Positions', 'pca_comp_0', 'pca_comp_1', 'tsne_comp_0', 'tsne_comp_1', 'cluster_pca', 'cluster_tsne'])
        full_csv = df_full.to_csv('Project/src/dataset/players_22_dimensionality_reduction_result.csv', index=False)

    elif requested_data == "all":
        
        df = pd.read_csv('Project/src/dataset/dimensionality_reduction_clust.csv')

        ####################### PCA CLUSTERS #######################
        df_clust_pca = pd.read_csv('Project/src/dataset/pca.csv')
        df_clust_pca = df_clust_pca.drop(columns=["cluster_pca"], errors='ignore')
        df_clust_pca.drop(df_clust_pca.filter(regex="Unname"),axis=1, inplace=True)
        kmeans_model = KMeans(n_clusters=int(requested_clust))
        kmeans_model.fit(df_clust_pca)
        df_clust_pca["cluster_pca"] = kmeans_model.labels_
        #csv_pca = df_clust_pca.to_csv('Project/src/dataset/players_22_pca.csv')

        ####################### TSNE CLUSTERS #######################
        df_clust_tsne = pd.read_csv('Project/src/dataset/tsne.csv')
        df_clust_tsne = df_clust_tsne.drop(columns=["cluster_tsne"], errors='ignore')
        df_clust_tsne.drop(df_clust_tsne.filter(regex="Unname"),axis=1, inplace=True)
        kmeans_model = KMeans(n_clusters=int(requested_clust))
        kmeans_model.fit(df_clust_tsne)
        df_clust_tsne["cluster_tsne"] = kmeans_model.labels_
        #csv_tsne = df_clust_tsne.to_csv('Project/src/dataset/players_22_tsne.csv')
        

        #FINAL COMPUTATIONS
        '''df_pca = pd.read_csv('Project/src/dataset/players_22_pca.csv')
        df_tsne = pd.read_csv('Project/src/dataset/players_22_tsne.csv')'''
        df_clust_pca.drop(df_clust_pca.filter(regex="Unname"),axis=1, inplace=True)
        df_clust_tsne.drop(df_clust_tsne.filter(regex="Unname"),axis=1, inplace=True)
        df_full = df.join(df_clust_pca, how="outer").join(df_clust_tsne, how="outer")
        print(df_full)
        df_full = df_full.filter(['sofifa_id', 'short_name', 'Positions', 'pca_comp_0', 'pca_comp_1', 'tsne_comp_0', 'tsne_comp_1', 'cluster_pca', 'cluster_tsne'])
        full_csv = df_full.to_csv('Project/src/dataset/dimensionality_reduction_result.csv', index=False)


    else:
        with open('Project/src/selected_position.txt', 'w') as f:
            roles = ""
            for elem in requested_data:
                if len(roles) != 0:
                    roles += "," + elem
                else:
                    roles += elem
            f.write(roles)
        
        df_clust = pd.read_csv('Project/src/dataset/players_22.csv')
        df_clust = df_clust.loc[(df_clust['league_name'] == "French Ligue 1") | (df_clust['league_name'] == "Italian Serie A") | (df_clust['league_name'] == "English Premier League") | (df_clust['league_name'] == "Spain Primera Division") | (df_clust['league_name'] == "German 1. Bundesliga")]
        df_clust.reset_index(drop=True, inplace=True)
        df_clust = df_clust.filter(['sofifa_id', 'short_name', 'player_positions', 'overall', 'potential', 'value_eur', 'wage_eur', 'age', 'height_cm', 'weight_cm', 'weak_foot', 'skill_moves', 'release_clause_eur', 'pace', 'shooting', 'dribbling', 'defending', 'physic', 'attacking_crossing', 'attacking_finishing', 'attacking_heading_accuracy', 'attacking_short_passing', 'attacking_volleys', 'skill_dribbling', 'skill_curve', 'skill_fk_accuracy', 'skill_long_passing', 'skill_ball_control', 'movement_acceleration', 'movement_sprint_speed', 'movement_agility', 'movement_reactions', 'movement_balance', 'power_shot_power', 'power_jumping', 'power_stamina', 'power_strength', 'power_long_shots', 'mentality_aggression', 'mentality_interceptions', 'mentality_positioning', 'mentality_vision', 'mentality_penalties', 'mentality_composure', 'defending_marking_awareness', 'defending_standing_tackle', 'defending_sliding_tackle', 'goalkeeping_diving', 'goalkeeping_handling', 'goalkeeping_kicking', 'goalkeeping_positioning', 'goalkeeping_reflexes', 'goalkeeping_speed'])
        df_clust = df_clust.rename(columns=({'player_positions': 'Positions'}))
        df_clust['Positions'] = df_clust.Positions.str.split(',').str[0]
        df_clust['Positions'] = df_clust['Positions'].replace({'CAM' : 'Midfielder', 'CB' : 'Defender', 'CDM' : 'Midfielder', 'CM' : 'Midfielder', 'LAM' : 'Midfielder', 'LB' : 'Defender', 'LCB' : 'Defender', 'LCM' : 'Midfielder', 'LDM' : 'Midfielder', 'LF' : 'Forward', 'LM' : 'Midfielder', 'LS' : 'Forward', 'LW' : 'Midfielder', 'LWB' : 'Defender', 'RAM' : 'Midfielder', 'RB' : 'Defender', 'RCB' : 'Defender', 'RCM' : 'Midfielder', 'RDM' : 'Midfielder', 'RF' : 'Forward', 'RM' : 'Midfielder', 'RS' : 'Forward', 'RW' : 'Midfielder', 'RWB' : 'Defender', 'ST' : 'Forward', 'GK' : 'Goalkeeper', 'CF' : 'Forward'})

        
        df_clust_sp = df_clust.fillna(0)
        csv_clust1 = df_clust_sp.to_csv('Project/src/dataset/players_22_for_dimensionality_reduction_clust.csv')
        csv_clust = df_clust_sp.to_csv('Project/src/dataset/players_22_for_dimensionality_reduction.csv', index=False)

        ############################################################################################### SCATTERPLOT ###############################################################################################

        df = pd.read_csv('Project/src/dataset/players_22_for_dimensionality_reduction.csv')
        df1 = pd.read_csv('Project/src/dataset/players_22_for_dimensionality_reduction_clust.csv')
        if len(requested_data) == 1:
            df = df.loc[(df['Positions'] == str(requested_data[0]))]
            df.reset_index(drop=True, inplace=True)
            df1 = df1.loc[(df1['Positions'] == str(requested_data[0]))]
            df1.reset_index(drop=True, inplace=True)
        elif len(requested_data) == 2:
            df = df.loc[(df['Positions'] == str(requested_data[0])) | (df['Positions'] == str(requested_data[1]))]
            df.reset_index(drop=True, inplace=True)
            df1 = df1.loc[(df1['Positions'] == str(requested_data[0])) | (df1['Positions'] == str(requested_data[1]))]
            df1.reset_index(drop=True, inplace=True)
        elif len(requested_data) == 3:
            df = df.loc[(df['Positions'] == str(requested_data[0])) | (df['Positions'] == str(requested_data[1])) | (df['Positions'] == str(requested_data[2]))]
            df.reset_index(drop=True, inplace=True)
            df1 = df1.loc[(df1['Positions'] == str(requested_data[0])) | (df1['Positions'] == str(requested_data[1])) | (df1['Positions'] == str(requested_data[2]))]
            df1.reset_index(drop=True, inplace=True)
        elif len(requested_data) == 4:
            df = df.loc[(df['Positions'] == str(requested_data[0])) | (df['Positions'] == str(requested_data[1])) | (df['Positions'] == str(requested_data[2])) | (df['Positions'] == str(requested_data[3]))]
            df.reset_index(drop=True, inplace=True)
            df1 = df1.loc[(df1['Positions'] == str(requested_data[0])) | (df1['Positions'] == str(requested_data[1])) | (df1['Positions'] == str(requested_data[2])) | (df1['Positions'] == str(requested_data[3]))]
            df1.reset_index(drop=True, inplace=True)
        csv = df.to_csv('Project/src/dataset/players_22_for_dimensionality_reduction.csv', index=False)
        csv1 = df.to_csv('Project/src/dataset/players_22_for_dimensionality_reduction_clust.csv')


        #PCA
        d = np.genfromtxt('Project/src/dataset/players_22_for_dimensionality_reduction.csv', skip_header=1, usecols=[3,4,9,10,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51], delimiter=',', encoding='utf-8')
        #normalize the data with StandardScaler
        d_std = preprocessing.StandardScaler().fit_transform(d)
        #compute PCA
        pca=PCA(n_components=2)
        d_pca=pca.fit_transform(d_std)
        columns = ['pca_comp_%i' % i for i in range(2)]
        df_pca  = pd.DataFrame(d_pca, columns=columns)
        if requested_clust != "no":
            kmeans_model = KMeans(n_clusters=int(requested_clust))
            kmeans_model.fit(df_pca)
            df_pca["cluster_pca"] = kmeans_model.labels_        
        csv_pca = df_pca.to_csv('Project/src/dataset/players_22_pca.csv')

        #TSNE
        RS = 20150101
        data = pd.io.parsers.read_csv('Project/src/dataset/players_22_for_dimensionality_reduction.csv', header=0, usecols=[3,4,9,10,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51])
        d=data.to_numpy()
        std_scale = preprocessing.StandardScaler().fit_transform(d)
        #d = std_scale.transform(d)   
        digits_proj_tsne = TSNE(random_state=RS).fit_transform(std_scale)
        cols = ['tsne_comp_%i' % i for i in range(2)]
        df_tsne  = pd.DataFrame(digits_proj_tsne, columns=cols)
        if requested_clust != "no":
            kmeans_model = KMeans(n_clusters=int(requested_clust))
            kmeans_model.fit(df_tsne)
            df_tsne["cluster_tsne"] = kmeans_model.labels_
        csv_tsne = df_tsne.to_csv('Project/src/dataset/players_22_tsne.csv')

        #FINAL COMPUTATIONS
        df_full = df.join(df_pca).join(df_tsne)
        df_full = df_full.filter(['sofifa_id', 'short_name', 'Positions', 'pca_comp_0', 'pca_comp_1', 'tsne_comp_0', 'tsne_comp_1', 'cluster_pca', 'cluster_tsne'])
        full_csv = df_full.to_csv('Project/src/dataset/players_22_dimensionality_reduction_result.csv', index=False)
    
        ############################################################################################### LINE CHART ###############################################################################################
        df_clust = pd.read_csv('Project/src/dataset/players_22_filtered_data.csv')
        
        #LINE CHART
        df_line_chart = df_clust.filter(['sofifa_id', 'short_name', 'value_eur', 'wage_eur', 'Positions'])
        df_line_chart = df_line_chart.sort_values(by=['value_eur'], ascending=False)

        if len(requested_data) == 1:
            df_line_chart = df_line_chart.loc[(df_line_chart['Positions'] == str(requested_data[0]))]
            df_line_chart.reset_index(drop=True, inplace=True)
        elif len(requested_data) == 2:
            df_line_chart = df_line_chart.loc[(df_line_chart['Positions'] == str(requested_data[0])) | (df_line_chart['Positions'] == str(requested_data[1]))]
            df_line_chart.reset_index(drop=True, inplace=True)
        elif len(requested_data) == 3:
            df_line_chart = df_line_chart.loc[(df_line_chart['Positions'] == str(requested_data[0])) | (df_line_chart['Positions'] == str(requested_data[1])) | (df_line_chart['Positions'] == str(requested_data[2]))]
            df_line_chart.reset_index(drop=True, inplace=True)
        elif len(requested_data) == 4:
            df_line_chart = df_line_chart.loc[(df_line_chart['Positions'] == str(requested_data[0])) | (df_line_chart['Positions'] == str(requested_data[1])) | (df_line_chart['Positions'] == str(requested_data[2])) | (df_line_chart['Positions'] == str(requested_data[3]))]
            df_line_chart.reset_index(drop=True, inplace=True)

        #PERCENTILE VALORI DI MERCATO
        #value:
        sz = df_line_chart['value_eur'].size-1
        df_line_chart['percentile'] = df_line_chart['value_eur'].rank(method='max').apply(lambda x: 100.0*(x-1)/sz)
        df_line_chart['percentile'] = df_line_chart['percentile'].round(2)
        value = df_line_chart['percentile'].value_counts()
        df_line_chart['count'] = df_line_chart['percentile'].map(value)
        #wage:
        sz = df_line_chart['wage_eur'].size-1
        df_line_chart['percentile_wage'] = df_line_chart['wage_eur'].rank(method='max').apply(lambda x: 100.0*(x-1)/sz)
        df_line_chart['percentile_wage'] = df_line_chart['percentile_wage'].round(2)
        value = df_line_chart['percentile_wage'].value_counts()
        values_result = df_line_chart.to_csv('Project/src/dataset/players_22_list_values.csv', index=False)
        
        df_line_chart = df_clust.filter(['sofifa_id','short_name','value_eur', 'wage_eur', 'Positions'])
        df_line_chart = df_line_chart.sort_values(by=['wage_eur'], ascending=False)

        if len(requested_data) == 1:
            df_line_chart = df_line_chart.loc[(df_line_chart['Positions'] == str(requested_data[0]))]
            df_line_chart.reset_index(drop=True, inplace=True)
        elif len(requested_data) == 2:
            df_line_chart = df_line_chart.loc[(df_line_chart['Positions'] == str(requested_data[0])) | (df_line_chart['Positions'] == str(requested_data[1]))]
            df_line_chart.reset_index(drop=True, inplace=True)
        elif len(requested_data) == 3:
            df_line_chart = df_line_chart.loc[(df_line_chart['Positions'] == str(requested_data[0])) | (df_line_chart['Positions'] == str(requested_data[1])) | (df_line_chart['Positions'] == str(requested_data[2]))]
            df_line_chart.reset_index(drop=True, inplace=True)
        elif len(requested_data) == 4:
            df_line_chart = df_line_chart.loc[(df_line_chart['Positions'] == str(requested_data[0])) | (df_line_chart['Positions'] == str(requested_data[1])) | (df_line_chart['Positions'] == str(requested_data[2])) | (df_line_chart['Positions'] == str(requested_data[3]))]
            df_line_chart.reset_index(drop=True, inplace=True)

        #PERCENTILE STIPENDI
        #wage:
        sz = df_line_chart['wage_eur'].size-1
        df_line_chart['percentile'] = df_line_chart['wage_eur'].rank(method='max').apply(lambda x: 100.0*(x-1)/sz)
        df_line_chart['percentile'] = df_line_chart['percentile'].round(2)
        value = df_line_chart['percentile'].value_counts()
        df_line_chart['count'] = df_line_chart['percentile'].map(value)
        #value:
        sz = df_line_chart['value_eur'].size-1
        df_line_chart['percentile_value'] = df_line_chart['value_eur'].rank(method='max').apply(lambda x: 100.0*(x-1)/sz)
        df_line_chart['percentile_value'] = df_line_chart['percentile_value'].round(2)
        value = df_line_chart['percentile'].value_counts()
        wages_result = df_line_chart.to_csv('Project/src/dataset/players_22_list_wages.csv', index=False)


        ############################################################################################### RADVIZ ###############################################################################################

        
        df_radviz = df_clust.sort_values(by=['overall'], ascending=False)

        if len(requested_data) == 1:
            df_radviz = df_radviz.loc[(df_radviz['Positions'] == str(requested_data[0]))]
            df_radviz.reset_index(drop=True, inplace=True)
        elif len(requested_data) == 2:
            df_radviz = df_radviz.loc[(df_radviz['Positions'] == str(requested_data[0])) | (df_radviz['Positions'] == str(requested_data[1]))]
            df_radviz.reset_index(drop=True, inplace=True)
        elif len(requested_data) == 3:
            df_radviz = df_radviz.loc[(df_radviz['Positions'] == str(requested_data[0])) | (df_radviz['Positions'] == str(requested_data[1])) | (df_radviz['Positions'] == str(requested_data[2]))]
            df_radviz.reset_index(drop=True, inplace=True)
        elif len(requested_data) == 4:
            df_radviz = df_radviz.loc[(df_radviz['Positions'] == str(requested_data[0])) | (df_radviz['Positions'] == str(requested_data[1])) | (df_radviz['Positions'] == str(requested_data[2])) | (df_radviz['Positions'] == str(requested_data[3]))]
            df_radviz.reset_index(drop=True, inplace=True)

        df_radviz_attack = df_radviz.filter(['Positions', 'short_name', 'sofifa_id', 'attacking_crossing','attacking_finishing', 'attacking_heading_accuracy', 'attacking_short_passing', 'attacking_volleys', 'skill_dribbling', 'skill_curve', 'skill_long_passing', 'skill_ball_control', 'skill_fk_accuracy', 'passing', 'shooting'])
        df_radviz_attack = df_radviz_attack.rename(columns=({ 'attacking_crossing': 'Crossing', 'attacking_finishing': 'Finishing', 'attacking_heading_accuracy': 'Heading', 'attacking_short_passing': 'ShortPassing', 'attacking_volleys': 'Volleys', 'skill_dribbling': 'Dribbling', 'skill_curve': 'Curve', 'skill_long_passing': 'LongPassing', 'skill_ball_control': 'BallControl', 'skill_fk_accuracy': 'FKAccuracy', 'passing': 'Passing', 'shooting': 'Shooting'}))

        df_radviz_defending = df_radviz.filter(['Positions', 'sofifa_id', 'short_name', 'physic', 'defending', 'movement_reactions', 'mentality_aggression', 'mentality_interceptions', 'mentality_positioning', 'mentality_composure', 'defending_marking_awareness', 'defending_standing_tackle', 'defending_sliding_tackle', 'power_jumping', 'power_strength'])
        df_radviz_defending = df_radviz_defending.rename(columns=({ 'physic': 'Physic', 'defending': 'Defending', 'movement_reactions': 'Reactions', 'mentality_aggression': 'Aggression', 'mentality_interceptions': 'Interceptions', 'mentality_positioning': 'Positioning', 'mentality_composure': 'Composure', 'defending_marking_awareness': 'MarkingAwareness', 'defending_standing_tackle': 'StandingTackle', 'defending_sliding_tackle': 'SlidingTackle', 'power_jumping': 'Jumping', 'power_strength': 'Strength'}))

        df_radviz_physic = df_radviz.filter(['Positions', 'short_name', 'sofifa_id', 'movement_acceleration', 'movement_sprint_speed', 'pace', 'movement_agility', 'movement_balance', 'mentality_vision', 'mentality_penalties', 'power_stamina', 'power_shot_power', 'power_long_shots'])
        df_radviz_physic = df_radviz_physic.rename(columns=({ 'movement_acceleration': 'Acceleration', 'movement_sprint_speed': 'SprintSpeed', 'pace': 'Pace', 'movement_agility': 'Agility', 'movement_balance': 'Balance', 'mentality_vision': 'Vision', 'mentality_penalties': 'Penalties', 'power_stamina': 'Stamina', 'power_shot_power': 'ShotPower', 'power_long_shots': 'LongShots'}))

        df_radviz_gk = df_radviz.filter(['Positions', 'sofifa_id', 'short_name', 'goalkeeping_diving', 'goalkeeping_handling', 'goalkeeping_kicking', 'goalkeeping_positioning', 'goalkeeping_reflexes', 'goalkeeping_speed', 'attacking_short_passing', 'skill_long_passing'])
        df_radviz_gk = df_radviz_gk.rename(columns=({ 'goalkeeping_diving': 'Diving', 'goalkeeping_handling': 'Handling', 'goalkeeping_kicking': 'Kicking', 'goalkeeping_positioning': 'Positioning', 'goalkeeping_reflexes': 'Reflexes', 'goalkeeping_speed': 'Speed', 'attacking_short_passing': 'ShortPassing', 'skill_long_passing': 'LongPassing'}))
        
        df_radviz_overall = df_radviz.filter(['Positions', 'sofifa_id', 'short_name', 'pace','shooting','passing','dribbling','defending','physic'])
        df_radviz_overall = df_radviz_overall.rename(columns=({ 'pace': 'Pace', 'shooting': 'Shooting', 'dribbling': 'Dribbling', 'passing': 'Passing', 'defending': 'Defending', 'physic': 'Physic'}))
        
        csv_radviz_overall = df_radviz_overall.to_csv('Project/src/dataset/players_22_overall.csv', index=False)
        csv_radviz_attack = df_radviz_attack.to_csv('Project/src/dataset/players_22_attack.csv', index=False)
        csv_radviz_defending = df_radviz_defending.to_csv('Project/src/dataset/players_22_defending.csv', index=False)
        csv_radviz_physic = df_radviz_physic.to_csv('Project/src/dataset/players_22_physic.csv', index=False)
        csv_radviz_gk = df_radviz_gk.to_csv('Project/src/dataset/players_22_gk.csv', index=False)

    return "Done."
        


if __name__ == "__main__":
    flask_server.run(debug=True)