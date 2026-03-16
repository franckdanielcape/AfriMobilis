import urllib.request
import json
import re

url = 'https://fr.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=content&titles=Liste_des_communes_de_C%C3%B4te_d%27Ivoire&format=json'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read())
        pages = data['query']['pages']
        page = list(pages.values())[0]
        wikitext = page['revisions'][0]['*']
        
        lines = wikitext.split('|-')
        communes = []
        for section in lines:
            if '|' in section and '||' in section:
                # typically looks like:
                # | [[Abengourou]] || Indénié-Djuablin || [[Département d'Abengourou|Abengourou]]
                parts = section.strip().split('||')
                if len(parts) >= 2:
                    nom_part = parts[0].strip()[1:].strip() # remove leading '| '
                    region_part = parts[1].strip()
                    
                    def clean_link(osStr):
                        # extract text from [[Link|Text]] or [[Text]]
                        t = str(osStr)
                        match = re.search(r'\[\[(.*?)\]\]', t)
                        if match:
                            m = match.group(1)
                            return m.split('|')[-1]
                        return re.sub(r'<.*?>', '', t).strip()
                    
                    nom = clean_link(nom_part)
                    region = clean_link(region_part)
                    
                    if nom and nom.lower() != 'nom' and nom.lower() != 'communes' and not nom.startswith('align'):
                        code = nom[:3].upper() if len(nom) >= 3 else nom.upper()
                        communes.append({
                            'nom': nom,
                            'region': region,
                            'code': code
                        })
        
        unique = {}
        for c in communes:
            unique[c['nom']] = c
            
        final_list = list(unique.values())
        final_list.sort(key=lambda x: x['nom'])
        
        print(f'Found {len(final_list)} communes via Wikipedia.')
        
        # fallback to standard list if scrape fails
        if len(final_list) < 100:
             final_list = [{'nom': n, 'region': 'Inconnue', 'code': n[:3].upper()} for n in ["Abengourou", "Abidjan", "Abobo", "Aboisso", "Adiaké", "Adjamé", "Adzopé", "Afféry", "Agboville", "Agnibilékrou", "Agou", "Akoupé", "Alépé", "Anoumaba", "Anyama", "Arrah", "Assinie", "Assuéffry", "Attécoubé", "Attiegouakro", "Ayamé", "Azaguié", "Bako", "Bangolo", "Bassawa", "Bédiala", "Béoumi", "Béttié", "Biankouma", "Bin-Houyé", "Bingerville", "Bloléquin", "Bocanda", "Bodokro", "Bondoukou", "Bongouanou", "Boniérédougou", "Bonon", "Bonoua", "Booko", "Borotou", "Botro", "Bouaflé", "Bouaké", "Bouna", "Boundiali", "Brobo", "Buyo", "Cocody", "Dabakala", "Dabou", "Daloa", "Danané", "Daoukro", "Diabo", "Dianra", "Diawala", "Didiévi", "Diégonéfla", "Dikodougou", "Dimbokro", "Dioulatiédougou", "Divo", "Djebonoua", "Djèkanou", "Djibrosso", "Doropo", "Dualla", "Duékoué", "Ettrokro", "Facobly", "Ferkessédougou", "Foumbolo", "Fresco", "Fronan", "Gagnoa", "Gbeleban", "Gboguhé", "Gbon", "Gbonné", "Gohitafla", "Goulia", "Grabo", "Grand-Bassam", "Grand-Béréby", "Grand-Lahou", "Grand-Zattry", "Guéyo", "Guibéroua", "Guiembé", "Guiglo", "Guintéguéla", "Guitry", "Hiré", "Issia", "Jacqueville", "Kanakono", "Kani", "Kaniasso", "Karakoro", "Kasséré", "Katiola", "Kokoumbo", "Kolia", "Komborodougou", "Kong", "Kongasso", "Koonan", "Korhogo", "Koro", "Kouassi-Datékro", "Kouassi-Kouassikro", "Kouibly", "Koumassi", "Koumbala", "Koun-Fao", "Kounahiri", "Kouto", "Lakota", "Logoualé", "M'bahiakro", "M'batto", "M'bengué", "Madinani", "Maféré", "Man", "Mankono", "Marcory", "Massala", "Mayo", "Méagui", "Minignan", "Morondo", "N'douci", "Napié", "Nassian", "Niablé", "Niakaramandougou", "Niéllé", "Niofoin", "Odienné", "Ouangolodougou", "Ouaninou", "Ouellé", "Oumé", "Ouragahio", "Plateau", "Port-Bouët", "Prikro", "Rubino", "Saïoua", "Sakassou", "Samatiguila", "San Pedro", "Sandégué", "Sangouiné", "Sarhala", "Sassandra", "Satama-Sokoro", "Satama-Sokoura", "Séguéla", "Séguelon", "Seydougou", "Sifié", "Sikensi", "Sinématiali", "Sinfra", "Sipilou", "Sirasso", "Songon", "Soubré", "Taabo", "Tabou", "Tafiré", "Taï", "Tanda", "Téhini", "Tengréla", "Tiapoum", "Tiassalé", "Tié N'Diékro", "Tiébissou", "Tiémé", "Tiémélékro", "Tieningboué", "Tienko", "Tioroniaradougou", "Touba", "Toulépleu", "Toumodi", "Transua", "Treichville", "Vavoua", "Yakassé-Attobrou", "Yamoussoukro", "Yopougon", "Zikisso", "Zouan-Hounien", "Zoukougbeu", "Zuénoula"]]
        
        print(f'Final array length: {len(final_list)}')
        
        with open('communes_ci.json', 'w', encoding='utf-8') as f:
            json.dump(final_list, f, indent=4, ensure_ascii=False)
except Exception as e:
    print('Error:', e)
