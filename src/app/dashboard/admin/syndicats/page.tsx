'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import { Button } from '@/components/ui';
import styles from './syndicats.module.css';
import { ChefModal } from '@/components/admin/ChefModal';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const VILLES_CI = [
    {
        nom: 'Abengourou',
        region: 'Moyen Comoe  ',
        code: 'ABE'
    },
    {
        nom: 'Abobo',
        region: 'Lagunes',
        code: 'ABO'
    },
    {
        nom: 'Aboisso',
        region: 'Sud-comoe',
        code: 'ABO'
    },
    {
        nom: 'Adiaké',
        region: 'Sud-comoe',
        code: 'ADI'
    },
    {
        nom: 'Adjamé',
        region: 'Lagunes',
        code: 'ADJ'
    },
    {
        nom: 'Adzopé',
        region: 'Agneby',
        code: 'ADZ'
    },
    {
        nom: 'Afféry',
        region: 'Agneby',
        code: 'AFF'
    },
    {
        nom: 'Agboville',
        region: 'Agneby',
        code: 'AGB'
    },
    {
        nom: 'Agnibilékrou',
        region: 'Moyen Comoe  ',
        code: 'AGN'
    },
    {
        nom: 'Agou',
        region: 'Agneby',
        code: 'AGO'
    },
    {
        nom: 'Akoupé',
        region: 'Agneby',
        code: 'AKO'
    },
    {
        nom: 'Alépé',
        region: 'Lagunes',
        code: 'ALÉ'
    },
    {
        nom: 'Anoumaba',
        region: 'N\'zi Comoe',
        code: 'ANO'
    },
    {
        nom: 'Anyama',
        region: 'Lagunes',
        code: 'ANY'
    },
    {
        nom: 'Arrah',
        region: 'N\'zi Comoe',
        code: 'ARR'
    },
    {
        nom: 'Assuefry',
        region: 'Zanzan',
        code: 'ASS'
    },
    {
        nom: 'Attecoubé',
        region: 'Lagunes',
        code: 'ATT'
    },
    {
        nom: 'Ayamé',
        region: 'Sud-comoe',
        code: 'AYA'
    },
    {
        nom: 'Azaguié',
        region: 'Agneby',
        code: 'AZA'
    },
    {
        nom: 'Bako',
        region: 'Denguele',
        code: 'BAK'
    },
    {
        nom: 'Bangolo',
        region: 'Montagnes',
        code: 'BAN'
    },
    {
        nom: 'Banguera',
        region: 'N\'zi Comoe',
        code: 'BAN'
    },
    {
        nom: 'Bassawa',
        region: 'Vallee Du Bandama',
        code: 'BAS'
    },
    {
        nom: 'Bediala',
        region: 'Haut-sassandra',
        code: 'BED'
    },
    {
        nom: 'Beoumi',
        region: 'Vallee Du Bandama',
        code: 'BEO'
    },
    {
        nom: 'Bettié',
        region: 'Moyen Comoe  ',
        code: 'BET'
    },
    {
        nom: 'Biankouma',
        region: 'Montagnes',
        code: 'BIA'
    },
    {
        nom: 'Bin-Houyé',
        region: 'Montagnes',
        code: 'BIN'
    },
    {
        nom: 'Bingerville',
        region: 'Lagunes',
        code: 'BIN'
    },
    {
        nom: 'Bloléquin',
        region: 'Moyen Cavally',
        code: 'BLO'
    },
    {
        nom: 'Bocanda',
        region: 'N\'zi Comoe',
        code: 'BOC'
    },
    {
        nom: 'Bodokro',
        region: 'Vallee Du Bandama',
        code: 'BOD'
    },
    {
        nom: 'Bondoukou',
        region: 'Zanzan',
        code: 'BON'
    },
    {
        nom: 'Bongouanou',
        region: 'N\'zi Comoe',
        code: 'BON'
    },
    {
        nom: 'Bonieredougou',
        region: 'Vallee Du Bandama',
        code: 'BON'
    },
    {
        nom: 'Bonon',
        region: 'Marahoue',
        code: 'BON'
    },
    {
        nom: 'Bonoua',
        region: 'Sud-comoe',
        code: 'BON'
    },
    {
        nom: 'Booko',
        region: 'Baffing',
        code: 'BOO'
    },
    {
        nom: 'Borotou',
        region: 'Baffing',
        code: 'BOR'
    },
    {
        nom: 'Botro',
        region: 'Vallee Du Bandama',
        code: 'BOT'
    },
    {
        nom: 'Bouaflé',
        region: 'Marahoue',
        code: 'BOU'
    },
    {
        nom: 'Bouaké',
        region: 'Vallee Du Bandama',
        code: 'BOU'
    },
    {
        nom: 'Bouna',
        region: 'Zanzan',
        code: 'BOU'
    },
    {
        nom: 'Boundiali',
        region: 'Savanes',
        code: 'BOU'
    },
    {
        nom: 'Brobo',
        region: 'Vallee Du Bandama',
        code: 'BRO'
    },
    {
        nom: 'Buyo',
        region: ' Bas-sassandra',
        code: 'BUY'
    },
    {
        nom: 'Cocody',
        region: 'Lagunes',
        code: 'COC'
    },
    {
        nom: 'Dabakala',
        region: 'Vallee Du Bandama',
        code: 'DAB'
    },
    {
        nom: 'Dabou',
        region: 'Lagunes',
        code: 'DAB'
    },
    {
        nom: 'Daloa',
        region: 'Haut-sassandra',
        code: 'DAL'
    },
    {
        nom: 'Danané',
        region: 'Montagnes',
        code: 'DAN'
    },
    {
        nom: 'Daoukro',
        region: 'N\'zi Comoe',
        code: 'DAO'
    },
    {
        nom: 'Diabo',
        region: 'Vallee Du Bandama',
        code: 'DIA'
    },
    {
        nom: 'Dianra',
        region: 'Worodougou',
        code: 'DIA'
    },
    {
        nom: 'Diawala',
        region: 'Savanes',
        code: 'DIA'
    },
    {
        nom: 'Didiévi',
        region: 'Lacs ',
        code: 'DID'
    },
    {
        nom: 'Diégonéfla',
        region: 'Fromager',
        code: 'DIÉ'
    },
    {
        nom: 'Dikodougou',
        region: 'Savanes',
        code: 'DIK'
    },
    {
        nom: 'Dimbokro',
        region: 'N\'zi Comoe',
        code: 'DIM'
    },
    {
        nom: 'Dioulatiédougou',
        region: 'Denguele',
        code: 'DIO'
    },
    {
        nom: 'Divo',
        region: ' Sud-bandama',
        code: 'DIV'
    },
    {
        nom: 'Djebonoua',
        region: 'Vallee Du Bandama',
        code: 'DJE'
    },
    {
        nom: 'Djékanou',
        region: 'Lacs ',
        code: 'DJÉ'
    },
    {
        nom: 'Djibrosso',
        region: 'Worodougou',
        code: 'DJI'
    },
    {
        nom: 'Doropo',
        region: 'Zanzan',
        code: 'DOR'
    },
    {
        nom: 'Dualla',
        region: 'Worodougou',
        code: 'DUA'
    },
    {
        nom: 'Duékoué',
        region: 'Moyen Cavally',
        code: 'DUÉ'
    },
    {
        nom: 'Ettrokro',
        region: 'N\'zi Comoe',
        code: 'ETT'
    },
    {
        nom: 'Etuéboué',
        region: 'Sud-comoe',
        code: 'ETU'
    },
    {
        nom: 'Facobly',
        region: 'Montagnes',
        code: 'FAC'
    },
    {
        nom: 'Ferkessedougou',
        region: 'Savanes',
        code: 'FER'
    },
    {
        nom: 'Foumbolo',
        region: 'Vallee Du Bandama',
        code: 'FOU'
    },
    {
        nom: 'Fresco',
        region: ' Sud-bandama',
        code: 'FRE'
    },
    {
        nom: 'Fronan',
        region: 'Vallee Du Bandama',
        code: 'FRO'
    },
    {
        nom: 'Gagnoa',
        region: 'Fromager',
        code: 'GAG'
    },
    {
        nom: 'Gboguhé',
        region: 'Haut-sassandra',
        code: 'GBO'
    },
    {
        nom: 'Gbon',
        region: 'Savanes',
        code: 'GBO'
    },
    {
        nom: 'Gbonné',
        region: 'Montagnes',
        code: 'GBO'
    },
    {
        nom: 'Gohitafla',
        region: 'Marahoue',
        code: 'GOH'
    },
    {
        nom: 'Goulia',
        region: 'Denguele',
        code: 'GOU'
    },
    {
        nom: 'Grabo',
        region: ' Bas-sassandra',
        code: 'GRA'
    },
    {
        nom: 'Grand-Bassam',
        region: 'Sud-comoe',
        code: 'GRA'
    },
    {
        nom: 'Grand-Béréby',
        region: ' Bas-sassandra',
        code: 'GRA'
    },
    {
        nom: 'Grand-Lahou',
        region: 'Lagunes',
        code: 'GRA'
    },
    {
        nom: 'Grand-Zattry',
        region: ' Bas-sassandra',
        code: 'GRA'
    },
    {
        nom: 'Guibéroua',
        region: 'Fromager',
        code: 'GUI'
    },
    {
        nom: 'Guiembé',
        region: 'Savanes',
        code: 'GUI'
    },
    {
        nom: 'Guiglo',
        region: 'Moyen Cavally',
        code: 'GUI'
    },
    {
        nom: 'Guintéguéla',
        region: 'Baffing',
        code: 'GUI'
    },
    {
        nom: 'Guitry',
        region: ' Sud-bandama',
        code: 'GUI'
    },
    {
        nom: 'Hiré',
        region: ' Sud-bandama',
        code: 'HIR'
    },
    {
        nom: 'Issia',
        region: 'Haut-sassandra',
        code: 'ISS'
    },
    {
        nom: 'Jacqueville',
        region: 'Lagunes',
        code: 'JAC'
    },
    {
        nom: 'Kanakono',
        region: 'Savanes',
        code: 'KAN'
    },
    {
        nom: 'Kani',
        region: 'Worodougou',
        code: 'KAN'
    },
    {
        nom: 'Kaniasso',
        region: 'Denguele',
        code: 'KAN'
    },
    {
        nom: 'Karakoro',
        region: 'Savanes',
        code: 'KAR'
    },
    {
        nom: 'Kasséré',
        region: 'Savanes',
        code: 'KAS'
    },
    {
        nom: 'Katiola',
        region: 'Vallee Du Bandama',
        code: 'KAT'
    },
    {
        nom: 'Koffi-amonkro',
        region: 'N\'zi Comoe',
        code: 'KOF'
    },
    {
        nom: 'Kokoumbo',
        region: 'Lacs ',
        code: 'KOK'
    },
    {
        nom: 'Kolia',
        region: 'Savanes',
        code: 'KOL'
    },
    {
        nom: 'Komborodougou',
        region: 'Savanes',
        code: 'KOM'
    },
    {
        nom: 'Kong',
        region: 'Savanes',
        code: 'KON'
    },
    {
        nom: 'Kongasso',
        region: 'Worodougou',
        code: 'KON'
    },
    {
        nom: 'Koonan',
        region: 'Baffing',
        code: 'KOO'
    },
    {
        nom: 'Korhogo',
        region: 'Savanes',
        code: 'KOR'
    },
    {
        nom: 'Koro',
        region: 'Baffing',
        code: 'KOR'
    },
    {
        nom: 'Kouassi-datekro',
        region: 'Zanzan',
        code: 'KOU'
    },
    {
        nom: 'Kouassi-Kouassikro',
        region: 'N\'zi Comoe',
        code: 'KOU'
    },
    {
        nom: 'Kouibly',
        region: 'Montagnes',
        code: 'KOU'
    },
    {
        nom: 'Koumassi',
        region: 'Lagunes',
        code: 'KOU'
    },
    {
        nom: 'Koumbala',
        region: 'Savanes',
        code: 'KOU'
    },
    {
        nom: 'Kounahiri',
        region: 'Worodougou',
        code: 'KOU'
    },
    {
        nom: 'Kouto',
        region: 'Savanes',
        code: 'KOU'
    },
    {
        nom: 'Lakota',
        region: ' Sud-bandama',
        code: 'LAK'
    },
    {
        nom: 'Logoualé',
        region: 'Montagnes',
        code: 'LOG'
    },
    {
        nom: 'M\'bahiakro',
        region: 'N\'zi Comoe',
        code: 'M\'B'
    },
    {
        nom: 'M\'batto',
        region: 'N\'zi Comoe',
        code: 'M\'B'
    },
    {
        nom: 'M\'bengué',
        region: 'Savanes',
        code: 'M\'B'
    },
    {
        nom: 'Madinani',
        region: 'Denguele',
        code: 'MAD'
    },
    {
        nom: 'Maféré',
        region: 'Sud-comoe',
        code: 'MAF'
    },
    {
        nom: 'Man',
        region: 'Montagnes',
        code: 'MAN'
    },
    {
        nom: 'Mankono',
        region: 'Worodougou',
        code: 'MAN'
    },
    {
        nom: 'Marandallah',
        region: 'Worodougou',
        code: 'MAR'
    },
    {
        nom: 'Marcory',
        region: 'Lagunes',
        code: 'MAR'
    },
    {
        nom: 'Massala',
        region: 'Worodougou',
        code: 'MAS'
    },
    {
        nom: 'Méagui',
        region: ' Bas-sassandra',
        code: 'MÉA'
    },
    {
        nom: 'Minignan',
        region: 'Denguele',
        code: 'MIN'
    },
    {
        nom: 'Morondo',
        region: 'Worodougou',
        code: 'MOR'
    },
    {
        nom: 'Napiélédougou',
        region: 'Savanes',
        code: 'NAP'
    },
    {
        nom: 'Nassian',
        region: 'Zanzan',
        code: 'NAS'
    },
    {
        nom: 'Niablé',
        region: 'Moyen Comoe  ',
        code: 'NIA'
    },
    {
        nom: 'Niakaramandougou',
        region: 'Vallee Du Bandama',
        code: 'NIA'
    },
    {
        nom: 'Niellé',
        region: 'Savanes',
        code: 'NIE'
    },
    {
        nom: 'Niofoin',
        region: 'Savanes',
        code: 'NIO'
    },
    {
        nom: 'Odienné',
        region: 'Denguele',
        code: 'ODI'
    },
    {
        nom: 'Ouangolodougou',
        region: 'Savanes',
        code: 'OUA'
    },
    {
        nom: 'Ouaninou',
        region: 'Baffing',
        code: 'OUA'
    },
    {
        nom: 'Ouellé',
        region: 'N\'zi Comoe',
        code: 'OUE'
    },
    {
        nom: 'Oumé',
        region: 'Fromager',
        code: 'OUM'
    },
    {
        nom: 'Ouragahio',
        region: 'Fromager',
        code: 'OUR'
    },
    {
        nom: 'Plateau',
        region: 'Lagunes',
        code: 'PLA'
    },
    {
        nom: 'Port-Bouët',
        region: 'Lagunes',
        code: 'POR'
    },
    {
        nom: 'Prikro',
        region: 'N\'zi Comoe',
        code: 'PRI'
    },
    {
        nom: 'Rubino',
        region: 'Agneby',
        code: 'RUB'
    },
    {
        nom: 'Saïoua',
        region: 'Haut-sassandra',
        code: 'SAÏ'
    },
    {
        nom: 'Sakassou',
        region: 'Vallee Du Bandama',
        code: 'SAK'
    },
    {
        nom: 'Samatiguila',
        region: 'Denguele',
        code: 'SAM'
    },
    {
        nom: 'San-Pédro',
        region: ' Bas-sassandra',
        code: 'SAN'
    },
    {
        nom: 'Sandégué',
        region: 'Zanzan',
        code: 'SAN'
    },
    {
        nom: 'Sangouiné',
        region: 'Montagnes',
        code: 'SAN'
    },
    {
        nom: 'Sarhala',
        region: 'Worodougou',
        code: 'SAR'
    },
    {
        nom: 'Sassandra',
        region: ' Bas-sassandra',
        code: 'SAS'
    },
    {
        nom: 'Satama-Sokoro',
        region: 'Vallee Du Bandama',
        code: 'SAT'
    },
    {
        nom: 'Satama-Sokouro',
        region: 'Vallee Du Bandama',
        code: 'SAT'
    },
    {
        nom: 'Seguela',
        region: 'Worodougou',
        code: 'SEG'
    },
    {
        nom: 'Séguélon',
        region: 'Denguele',
        code: 'SÉG'
    },
    {
        nom: 'Seydougou',
        region: 'Denguele',
        code: 'SEY'
    },
    {
        nom: 'Sifié',
        region: 'Worodougou',
        code: 'SIF'
    },
    {
        nom: 'Sikensi',
        region: 'Lagunes',
        code: 'SIK'
    },
    {
        nom: 'Sinematiali',
        region: 'Savanes',
        code: 'SIN'
    },
    {
        nom: 'Sinfra',
        region: 'Marahoue',
        code: 'SIN'
    },
    {
        nom: 'Sipilou',
        region: 'Montagnes',
        code: 'SIP'
    },
    {
        nom: 'Sirasso',
        region: 'Savanes',
        code: 'SIR'
    },
    {
        nom: 'Songon',
        region: 'Lagunes',
        code: 'SON'
    },
    {
        nom: 'Soubré',
        region: ' Bas-sassandra',
        code: 'SOU'
    },
    {
        nom: 'Taabo',
        region: 'Lagunes',
        code: 'TAA'
    },
    {
        nom: 'Tabou',
        region: ' Bas-sassandra',
        code: 'TAB'
    },
    {
        nom: 'Tafiré',
        region: 'Vallee Du Bandama',
        code: 'TAF'
    },
    {
        nom: 'Taï',
        region: 'Moyen Cavally',
        code: 'TAÏ'
    },
    {
        nom: 'Tanda',
        region: 'Zanzan',
        code: 'TAN'
    },
    {
        nom: 'Tehini',
        region: 'Zanzan',
        code: 'TEH'
    },
    {
        nom: 'Tengréla',
        region: 'Savanes',
        code: 'TEN'
    },
    {
        nom: 'Tiapoum',
        region: 'Sud-comoe',
        code: 'TIA'
    },
    {
        nom: 'Tiassalé',
        region: 'Lagunes',
        code: 'TIA'
    },
    {
        nom: 'Tié-N\'diekro',
        region: 'Lacs ',
        code: 'TIÉ'
    },
    {
        nom: 'Tiébissou',
        region: 'Lacs ',
        code: 'TIÉ'
    },
    {
        nom: 'Tiémé',
        region: 'Denguele',
        code: 'TIÉ'
    },
    {
        nom: 'Tiemelékro',
        region: 'N\'zi Comoe',
        code: 'TIE'
    },
    {
        nom: 'Tieningboue',
        region: 'Worodougou',
        code: 'TIE'
    },
    {
        nom: 'Tienko',
        region: 'Denguele',
        code: 'TIE'
    },
    {
        nom: 'Tioroniaradougou',
        region: 'Savanes',
        code: 'TIO'
    },
    {
        nom: 'Tortiya',
        region: 'Vallee Du Bandama',
        code: 'TOR'
    },
    {
        nom: 'Touba',
        region: 'Baffing',
        code: 'TOU'
    },
    {
        nom: 'Toulepleu',
        region: 'Moyen Cavally',
        code: 'TOU'
    },
    {
        nom: 'Toumodi',
        region: 'Lacs ',
        code: 'TOU'
    },
    {
        nom: 'Transua',
        region: 'Zanzan',
        code: 'TRA'
    },
    {
        nom: 'Treichville',
        region: 'Lagunes',
        code: 'TRE'
    },
    {
        nom: 'Vavoua',
        region: 'Haut-sassandra',
        code: 'VAV'
    },
    {
        nom: 'Worofla',
        region: 'Worodougou',
        code: 'WOR'
    },
    {
        nom: 'Yakassé-Attobrou',
        region: 'Agneby',
        code: 'YAK'
    },
    {
        nom: 'Yamoussoukro',
        region: 'Lacs ',
        code: 'YAM'
    },
    {
        nom: 'Yopougon',
        region: 'Lagunes',
        code: 'YOP'
    },
    {
        nom: 'Zikisso',
        region: ' Sud-bandama',
        code: 'ZIK'
    },
    {
        nom: 'Zouan-Hounien',
        region: 'Montagnes',
        code: 'ZOU'
    },
    {
        nom: 'Zoukougbeu',
        region: 'Haut-sassandra',
        code: 'ZOU'
    },
    {
        nom: 'Zuénoula',
        region: 'Marahoue',
        code: 'ZUÉ'
    }
];

interface Chef {
    id: string;
    nom?: string;
    prenom?: string;
    email?: string;
    telephone?: string;
    syndicat_id?: string;
    status?: string;
}

interface Syndicat {
    id: string;
    nom: string;
    code?: string;
    zone?: string;
    region?: string;
    chef?: Chef | null;
    created_at?: string;
    zone_geographique?: {
        region?: string;
    };
}

interface VilleOption {
    nom: string;
    region: string;
    code: string;
}

function GestionsVillesSyndicatsContent() {
    const searchParams = useSearchParams();

    const [syndicats, setSyndicats] = useState<Syndicat[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ nom: '', code: '', region: '' });
    const [creating, setCreating] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(false);

    // Chef Modal States
    const [isChefModalOpen, setIsChefModalOpen] = useState(false);
    const [selectedSyndicatId, setSelectedSyndicatId] = useState<string | null>(null);
    const [selectedChef, setSelectedChef] = useState<Chef | null>(null);

    const fetchSyndicats = async () => {
        try {
            // Utiliser l&apos;API route qui bypass RLS avec Service Role Key
            // Ajouter un timestamp pour éviter le cache
            const timestamp = new Date().getTime();
            const response = await fetch(`/api/syndicats?t=${timestamp}`);
            const result = await response.json();

            if (!response.ok) {
                console.error('Erreur API:', result);
                alert(`❌ Erreur de chargement: ${result.error}`);
                setSyndicats([]);
                return;
            }

            const syndicatsData = result.data || [];

            // Récupérer les chefs de ligne associés via API (bypass RLS)
            const chefsResponse = await fetch('/api/chefs');
            const chefsResult = await chefsResponse.json();
            const chefsData = chefsResult.success ? chefsResult.data : [];

            const syndicatsWithChef = syndicatsData.map((syndicat: Syndicat) => {
                const localChef = chefsData.find((p: Chef) => p.syndicat_id === syndicat.id);
                return { ...syndicat, chef: localChef };
            });

            setSyndicats(syndicatsWithChef);
        } catch (err) {
            console.error("Erreur de récupération des villes/syndicats", err);
            alert("❌ Erreur de connexion à la base de données");
            setSyndicats([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredVilles = VILLES_CI.filter(v =>
        v.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.region.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelectVille = (ville: VilleOption) => {
        setFormData({
            nom: ville.nom,
            region: ville.region,
            code: ville.code
        });
        setSearchTerm(ville.nom);
        setDropdownOpen(false);
    };

    const handleCreateSyndicat = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);

        try {
            // Appeler l&apos;API route qui utilise la Service Role Key
            const response = await fetch('/api/syndicats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nom: formData.nom,
                    code: formData.code,
                    zone: formData.region,
                    zone_geographique: { region: formData.region }
                })
            });

            const result = await response.json();

            if (!response.ok) {
                console.error('Erreur API:', result);
                alert(`❌ Erreur: ${result.error}`);
                return;
            }

            // Succès - ajouter au state local
            setSyndicats([{ ...result.data, chef: null }, ...syndicats]);
            setIsModalOpen(false);
            setFormData({ nom: '', code: '', region: '' });
            alert('✅ Syndicat créé avec succès dans la base de données');
            
        } catch (err: unknown) {
            console.error('Erreur:', err);
            const message = err instanceof Error ? err.message : 'Erreur inconnue';
            alert(`❌ Erreur lors de la création: ${message}`);
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteSyndicat = async (id: string, nom: string) => {
        if (!confirm(`Êtes-vous sûr de vouloir supprimer le syndicat "${nom}" ?\n\n⚠️ Cette action est irréversible.`)) {
            return;
        }

        try {
            const response = await fetch('/api/syndicats', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });

            const result = await response.json();

            if (!response.ok) {
                console.error('Erreur API:', result);
                alert(`❌ Erreur: ${result.error}`);
                return;
            }

            // Recharger les données depuis le serveur pour avoir les stats à jour
            await fetchSyndicats();
            alert('✅ Syndicat supprimé avec succès');
            
        } catch (err: unknown) {
            console.error('Erreur:', err);
            const message = err instanceof Error ? err.message : 'Erreur inconnue';
            alert(`❌ Erreur lors de la suppression: ${message}`);
        }
    };

    useEffect(() => {
        fetchSyndicats();
    }, []);

    if (loading) return <div style={{ padding: '2rem' }}>Chargement des zones géographiques...</div>;

    // Debug: afficher les données en console
    console.log('Syndicats chargés:', syndicats);

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0' }}>🌍 Gestion des Villes et Syndicats</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Gérez le syndicat unique de Grand-Bassam et nommez le Chef de Ligne (Niveau 2).
                        <strong>Un seul syndicat couvre toute la ville de Grand-Bassam.</strong>
                    </p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>＋ Nouvelle Ville</Button>
            </div>

            {/* Info Base de Données */}
            <div style={{ 
                background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', 
                border: '1px solid #3b82f6', 
                borderRadius: '12px', 
                padding: '1.25rem',
                marginBottom: '2rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>🗄️</span>
                    <div>
                        <strong style={{ color: '#1e40af', display: 'block', marginBottom: '0.5rem' }}>
                            Base de Données Connectée
                        </strong>
                        <p style={{ margin: 0, color: '#1e40af', fontSize: '0.95rem', lineHeight: 1.5 }}>
                            Les syndicats sont maintenant enregistrés dans la base de données Supabase.
                            Données persistantes et sécurisées.
                        </p>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
                {syndicats.length === 0 ? (
                    <div style={{ padding: '3rem', background: 'var(--panel-bg)', borderRadius: '12px', textAlign: 'center', gridColumn: '1 / -1', border: '2px dashed #cbd5e1' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌍</div>
                        <h3 style={{ margin: '0 0 0.5rem 0', color: '#64748b' }}>Aucune ville configurée</h3>
                        <p style={{ margin: 0, color: '#94a3b8' }}>Cliquez sur &quot;Nouvelle Ville&quot; pour commencer</p>
                    </div>
                ) : (
                    syndicats.map(syndicat => (
                        <div key={syndicat.id} style={{
                            background: 'var(--panel-bg)',
                            border: '1px solid var(--border)',
                            borderRadius: '12px',
                            padding: '1.5rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem'
                        }}>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>
                                            {syndicat.nom}
                                        </h2>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                                            {syndicat.zone_geographique?.region || 'Région non spécifiée'}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', background: 'rgba(0,0,0,0.05)', borderRadius: '4px' }}>
                                            {syndicat.code}
                                        </span>
                                        <button
                                            onClick={() => handleDeleteSyndicat(syndicat.id, syndicat.nom)}
                                            style={{
                                                background: '#fef2f2',
                                                border: '1px solid #fecaca',
                                                color: '#dc2626',
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '0.8rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.25rem'
                                            }}
                                            title="Supprimer ce syndicat"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div style={{ 
                                padding: '1.25rem', 
                                background: syndicat.chef ? '#ffffff' : '#fef3c7', 
                                borderRadius: '12px', 
                                border: `2px solid ${syndicat.chef ? '#16a34a' : '#fde68a'}`,
                                boxShadow: syndicat.chef ? '0 4px 6px -1px rgba(22, 163, 74, 0.1), 0 2px 4px -1px rgba(22, 163, 74, 0.06)' : 'none',
                                transition: 'all 0.3s ease'
                            }}>
                                <div style={{ 
                                    fontSize: '0.75rem', 
                                    fontWeight: 700,
                                    color: syndicat.chef ? '#16a34a' : '#92400e', 
                                    textTransform: 'uppercase', 
                                    letterSpacing: '0.8px', 
                                    marginBottom: '0.75rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}>
                                    {syndicat.chef ? '✅' : '⏳'} Chef de Ligne (Niveau 2)
                                </div>
                                
                                {syndicat.chef ? (
                                    <div style={{ animation: 'fadeIn 0.5s ease' }}>
                                        <div style={{ 
                                            fontSize: '1.25rem',
                                            fontWeight: 700, 
                                            color: '#0f172a',
                                            marginBottom: '0.25rem',
                                            letterSpacing: '-0.2px'
                                        }}>
                                            {syndicat.chef.prenom} {syndicat.chef.nom}
                                        </div>
                                        {syndicat.chef.email && (
                                            <div style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <span>✉️</span>
                                                <span style={{ fontWeight: 500 }}>{syndicat.chef.email}</span>
                                            </div>
                                        )}
                                        <div style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <span>📱</span>
                                            <span style={{ fontWeight: 600, color: '#0f172a' }}>{syndicat.chef.telephone || 'Non renseigné'}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <Button 
                                                variant="secondary" 
                                                size="sm" 
                                                onClick={() => { 
                                                    setSelectedSyndicatId(syndicat.id); 
                                                    setSelectedChef(syndicat.chef || null); 
                                                    setIsChefModalOpen(true); 
                                                }}
                                                style={{
                                                    background: '#f1f5f9',
                                                    border: '1px solid #cbd5e1',
                                                    color: '#0f172a',
                                                    fontWeight: 500
                                                }}
                                            >
                                                ✏️ Modifier
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <div style={{ 
                                            color: '#92400e', 
                                            fontSize: '0.95rem', 
                                            marginBottom: '1rem',
                                            fontStyle: 'italic'
                                        }}>
                                            Aucun chef nommé pour le moment.
                                        </div>
                                        <Button 
                                            size="sm" 
                                            style={{ width: '100%' }} 
                                            onClick={() => { 
                                                setSelectedSyndicatId(syndicat.id); 
                                                setSelectedChef(null); 
                                                setIsChefModalOpen(true); 
                                            }}
                                        >
                                            👨‍💼 Nommer un Chef
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal de Création */}
            {isModalOpen && (
                <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>Créer une Nouvelle Zone / Base</h2>
                            <p className={styles.modalDescription}>Configurez une nouvelle ville ou antenne locale.</p>
                        </div>

                        <form onSubmit={handleCreateSyndicat}>
                            <div className={styles.formGroup} style={{ position: 'relative' }}>
                                <label className={styles.label}>Sélectionnez une Ville / Base <span style={{ color: 'var(--error)' }}>*</span></label>
                                <input
                                    type="text"
                                    required
                                    value={searchTerm}
                                    placeholder="Rechercher une ville (ex: Abidjan, Bouaké...)"
                                    onChange={e => {
                                        setSearchTerm(e.target.value);
                                        setDropdownOpen(true);
                                        // Reset region/code if user is typing manually a new unlisted city
                                        setFormData({ nom: e.target.value, code: '', region: '' });
                                    }}
                                    onFocus={() => setDropdownOpen(true)}
                                    className={styles.input}
                                />

                                {dropdownOpen && (
                                    <div className={styles.dropdownMenu}>
                                        {filteredVilles.length > 0 ? (
                                            filteredVilles.map(ville => (
                                                <div
                                                    key={ville.nom}
                                                    className={styles.dropdownItem}
                                                    onClick={() => handleSelectVille(ville)}
                                                >
                                                    <span style={{ fontWeight: 600 }}>{ville.nom}</span>
                                                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{ville.region}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div style={{ padding: '0.75rem 1rem', color: '#64748b', fontSize: '0.9rem' }}>
                                                Appuyez sur Entrée pour utiliser &quot;{searchTerm}&quot; comme ville personnalisée
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className={styles.formRow}>
                                <div>
                                    <label className={styles.label}>Région Administratrive</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.region}
                                        onChange={e => setFormData({ ...formData, region: e.target.value })}
                                        className={styles.input}
                                        placeholder="Ex: Lagunes"
                                    />
                                </div>
                                <div>
                                    <label className={styles.label}>Code Zone (ex: ABJ)</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.code}
                                        onChange={e => setFormData({ ...formData, code: e.target.value })}
                                        className={styles.input}
                                        placeholder="Ex: ABJ"
                                        maxLength={10}
                                    />
                                </div>
                            </div>

                            <div className={styles.formActions} style={{ marginTop: '2rem' }}>
                                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Annuler</Button>
                                <Button type="submit" disabled={creating || !formData.region || !formData.code || dropdownOpen}>
                                    {creating ? 'Création...' : 'Valider'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {selectedSyndicatId && (
                <ChefModal
                    isOpen={isChefModalOpen}
                    onClose={() => { setIsChefModalOpen(false); setSelectedSyndicatId(null); setSelectedChef(null); }}
                    onSuccess={fetchSyndicats}
                    syndicatId={selectedSyndicatId}
                    chefToEdit={selectedChef}
                />
            )}
        </div>
    );
}

export default function GestionsVillesSyndicats() {
    return (
        <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Chargement...</div>}>
            <GestionsVillesSyndicatsContent />
        </Suspense>
    );
}
