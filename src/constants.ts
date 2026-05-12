export const APP_VERSION = '7.8';

export const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export const WIC_CATEGORIES = [
  "EGC", "Gimme More", "HUT Pelanggan", "Join Marketing", "Kerjasama Awam", 
  "PCC", "Program Promosi", "Winback", "Home Service"
];

export const PETUGAS_LIST = [
  'Ayu', 'Deasy', 'Elia', 'Fauzan', 'Mustika', 'Putri', 'Restu', 'Ros', 'Sita', 'Riya', 'Fiona'
];

export const INITIAL_UPAYA_CATS = ["WA PERSONAL", "KUNJUNGAN", "TELPON", "SMS", "EMAIL", "CETAK SARANA PROMOSI", "MEDIA SOSIAL", "LAIN LAIN"];

export const CETAK_ITEMS = ["Flyer", "Baligo", "Voucher", "Banner", "Spanduk", "Lain-lain"];

export const PRESET_PANELS = [
  {"nama": "ANEMIA APLASTIK", "pemeriksaan": "Hematologi Lengkap\nRetikulosit\nGambaran Sumsum Tulang", "harga": 1875000},
  {"nama": "ANEMIA DEFISIENSI", "pemeriksaan": "Asam Folat\nBesi\nFerritin\nGambaran Darah Tepi\nHematologi Lengkap\nRetikulosit\nTIBC\nUIBC\nVitamin B12", "harga": 4906000},
  {"nama": "ANEMIA HEMOLITIK", "pemeriksaan": "Coombs' Test\nHaptoglobin\nRetikulosit\nGambaran Darah Tepi\nHematologi Lengkap\nG6PD\nBilirubin (Total/Direk/Indirek)\nAnalisis Hb", "harga": 4905000},
  {"nama": "DEMAM DENGUE", "pemeriksaan": "Anti-Dengue IgG & IgM\nDengue NS1 Antigen\nGOT\nGPT\nHematologi Lengkap", "harga": 1903000},
  {"nama": "DEMAM TIFOID", "pemeriksaan": "Hematologi Lengkap\nGPT\nGOT\nAnti-Salmonella typhi IgM", "harga": 945000},
  {"nama": "HEALTHY LIFE I", "pemeriksaan": "Glukosa Puasa\neLFG (CKD-EPI)\nUrine Rutin\nTrigliserida\nKreatinin\nHematologi Lengkap\nGPT\nGOT\nGamma GT\nCholesterol Total\nCholesterol LDL Direk\nCholesterol HDL\nAsam Urat\nRasio Chol.Total/Chol. HDL", "harga": 1427000},
  {"nama": "HEALTHY LIFE II", "pemeriksaan": "Glukosa Puasa\neLFG (CKD-EPI)\nUrine Rutin\nTrigliserida\nKreatinin\nHematologi Lengkap\nHbA1c\nGPT\nGOT\nGamma GT\nCholesterol Total\nCholesterol LDL Direk\nCholesterol HDL\nAsam Urat\nApo-B\nRasio Chol. LDL Direk/Apo B\nRasio Chol.Total/Chol. HDL", "harga": 2032000},
  {"nama": "HEALTHY LIFE III", "pemeriksaan": "Gamma GT\nGOT\nGPT\nHbA1c\nHematologi Lengkap\nKreatinin\nTrigliserida\nTSHs\nUrine Rutin\neLFG (CKD-EPI)\nGlukosa Puasa\nCholesterol Total\nCholesterol LDL Direk\nCholesterol HDL\nAsam Urat\nApo-B\nRasio Chol. LDL Direk/Apo B\nRasio Chol.Total/Chol. HDL", "harga": 2517000},
  {"nama": "HEALTHY LIFE IV", "pemeriksaan": "Glukosa Puasa\neLFG (CKD-EPI)\nVitamin D 25-OH Total\nUrine Rutin\nTSHs\nTrigliserida\nKreatinin\nHematologi Lengkap\nHbA1c\nGPT\nGOT\nGamma GT\nCholesterol Total\nCholesterol LDL Direk\nCholesterol HDL\nAsam Urat\nApo-B\nRasio Chol. LDL Direk/Apo B\nRasio Chol.Total/Chol. HDL", "harga": 3000000},
  {"nama": "HIPERTENSI", "pemeriksaan": "Glukosa Puasa\nRasio Albumin - Kreatinin Urin Sewaktu\neLFG Cys-C (CKD-EPI)\nUreum\nUrine Rutin\nUrea N\nTrigliserida\nNatrium\nKalium\nhs-CRP\nHematologi Lengkap\nHbA1c\nCystatin-C\nCholesterol Total\nCholesterol LDL Direk\nCholesterol HDL\nAsam Urat\nApo-B\nTekanan Darah", "harga": 1724000},
  {"nama": "KENDALI LUPUS", "pemeriksaan": "eLFG (CKD-EPI)\nAnti-dsDNA-NcX\nVitamin D 25-OH Total\nKreatinin\nHematologi Lengkap\nC4 Komplemen\nC3 Komplemen", "harga": 3704000},
  {"nama": "MENOPAUSE", "pemeriksaan": "Estradiol\nFSH\nVitamin D 25-OH Total\nTSHs\nCalcium\nAnti Mullerian Hormone (AMH)", "harga": 4587000},
  {"nama": "MULTIVITAMIN", "pemeriksaan": "Panel Vitamin B1 dan B6, LC-MS/MS\nVitamin D 25-OH Total\nVitamin B12\nVitamin A & E\nAsam Folat", "harga": 5386000},
  {"nama": "OBESITAS DEWASA", "pemeriksaan": "Adiponektin\nCholesterol HDL\nCholesterol LDL Direk\nCholesterol Total\nhs-CRP\nTrigliserida\nTSHs\nVitamin D 25-OH Total\nGlukosa Puasa\nLeptin", "harga": 4331000},
  {"nama": "OSTEOPOROSIS GOLD PLATINUM", "pemeriksaan": "Estradiol\nVitamin D 25-OH Total\nTSHs\nPTH Intact\nN-MID Osteocalcin\nFosfatase Alkali\nCTx (C-Telopeptide)\nCalcium", "harga": 5142000},
  {"nama": "OSTEOPOROSIS SILVER", "pemeriksaan": "Vitamin D 25-OH Total\nFosfatase Alkali\nCTx (C-Telopeptide)\nCalcium", "harga": 1677000},
  {"nama": "PEMANTAUAN PRE DIABETES", "pemeriksaan": "Amino Profile-Metabolic\nGlukosa Puasa\nRasio Albumin - Kreatinin Urin Sewaktu\nTrigliserida\nHbA1c\nCholesterol LDL Direk\nCholesterol HDL\nTekanan Darah", "harga": 959000},
  {"nama": "PEMANTAUAN TUMOR LAMBUNG", "pemeriksaan": "CA 72-4\nCEA\nCA 19-9", "harga": 3254000},
  {"nama": "PEMANTAUAN TUMOR PAYUDARA", "pemeriksaan": "CEA\nCA 15-3", "harga": 1679000},
  {"nama": "PENANDA PEMBEKUAN DARAH", "pemeriksaan": "D-Dimer\nFibrinogen\nRetraksi Bekuan\nRumpel Leede\nWaktu Pembekuan\nWaktu Perdarahan\nWaktu Protrombin", "harga": 2955000},
  {"nama": "PENANDA TUMOR HATI", "pemeriksaan": "CEA\nAFP", "harga": 1175000},
  {"nama": "PENANDA TUMOR KOLOREKTAL", "pemeriksaan": "Darah Samar\nCEA\nCA 19-9", "harga": 2013000},
  {"nama": "PENANDA TUMOR NASOFARING", "pemeriksaan": "Anti-EBV EA IgA\nAnti-EBV VCA IgA", "harga": 2664000},
  {"nama": "PENANDA TUMOR PARU", "pemeriksaan": "Cyfra 21-1\nSCC\nNSE\nCEA", "harga": 3955000},
  {"nama": "PENANDA TUMOR TIROID", "pemeriksaan": "Tiroglobulin\nCalcitonin", "harga": 2547000},
  {"nama": "PENGELOLAAN DM", "pemeriksaan": "Glukosa Puasa\nVitamin D 25-OH Total\neLFG Cys-C (CKD-EPI)\nRasio Albumin - Kreatinin Urin Sewaktu\nCystatin-C\nProtein Total, Albumin , Globulin\nGPT\nHbA1c\nTrigliserida\nUrine Rutin\nCholesterol Total\nAsam Urat\nCholesterol HDL\nCholesterol LDL Direk", "harga": 2782000},
  {"nama": "PREMARITAL LAKI-LAKI", "pemeriksaan": "Badan Inklusi HbH\nFerritin\nGambaran Darah Tepi\nGolongan Darah A, B, O dan Rhesus\nHBsAg\nHematologi Lengkap\nUrine Rutin\nVDRL/RPR\nKesan\nSaran\nGlukosa Puasa\nAnalisis Hb", "harga": 3034000},
  {"nama": "PREMARITAL PEREMPUAN", "pemeriksaan": "Anti-CMV IgG\nAnti-Rubella IgG\nAnti-Toxoplasma IgG\nBadan Inklusi HbH\nFerritin\nGambaran Darah Tepi\nGolongan Darah A, B, O dan Rhesus\nHBsAg\nHematologi Lengkap\nUrine Rutin\nVDRL/RPR\nKesan\nSaran\nGlukosa Puasa\nKesan\nAnalisis Hb", "harga": 4780000},
  {"nama": "RISIKO PJK/STROKE BASIC", "pemeriksaan": "Apo-B\nCholesterol HDL\nCholesterol LDL Direk\nCholesterol Total\nD-Dimer\nHbA1c\nHomocysteine\nhs-CRP\nLp(a)\nTrigliserida", "harga": 1505000},
  {"nama": "TIROID", "pemeriksaan": "Tshs\nFT4", "harga": 1114000},
  {"nama": "TORCH", "pemeriksaan": "Anti-CMV IgG\nAnti-CMV IgM\nAnti-HSV2 IgG\nAnti-Rubella IgG\nAnti-Rubella IgM\nAnti-Toxoplasma IgG\nAnti-Toxoplasma IgM\nAnti-HSV1", "harga": 3841000},
  {"nama": "UJI SARING ALERGI", "pemeriksaan": "IgE Total\nEosinofil Absolut\nFaeces Rutin", "harga": 1071000},
  {"nama": "UJI SARING ANEMIA", "pemeriksaan": "Gambaran Darah Tepi\nHematologi Lengkap\nRetikulosit", "harga": 754000},
  {"nama": "UJI SARING KANKER HATI", "pemeriksaan": "PIVKA-II\nAFP", "harga": 1238000},
  {"nama": "UJI SARING KANKER PROSTAT", "pemeriksaan": "Rasio Free PSA/PSA\nPSA\nFree PSA", "harga": 2149000},
  {"nama": "UJI SARING KANKER SERVIKS", "pemeriksaan": "Sitologi Serviks Berbasis Cairan (SSBC)\nHPV-DNA High Risk (HC)", "harga": 1617000},
  {"nama": "UJI SARING THALASSEMIA", "pemeriksaan": "Badan Inklusi HbH\nFerritin\nGambaran Darah Tepi\nHematologi Lengkap\nKesan\nAnalisis Hb", "harga": 2247000},
  {"nama": "WELLNESS BASIC", "pemeriksaan": "Glukosa Puasa\nRasio Albumin - Kreatinin Urin Sewaktu\nVitamin D 25-OH Total\nTrigliserida\nKreatinin\nhs-CRP\nHematologi Lengkap\nHbA1c\nGPT\nGOT\nCholesterol Total\nCholesterol LDL Direk\nCholesterol HDL\nAsam Urat\nIndeks Massa Tubuh\nTekanan Darah\nLingkar Perut\nRasio Chol.Total/Chol. HDL", "harga": 2612000},
  {"nama": "WELLNESS MEDIUM", "pemeriksaan": "EKG\nGlukosa Puasa\nRasio Albumin - Kreatinin Urine Sewaktu\neLFG Cys-C (CKD-EPI)\nVitamin D 25-OH Total\nTrigliserida\nNa, K, Cl\nhs-CRP\nHematologi Lengkap\nHbA1c\nGPT\nGOT\nCystatin-C\nCholesterol LDL Direk\nCholesterol Total\nCholesterol HDL\nAsam Urat\nApo-B\nIndeks Massa Tubuh\nLingkar Perut\nTekanan Darah\nRasio Chol.Total/Chol. HDL", "harga": 4248000},
  {"nama": "WINHEALTH PLUS", "pemeriksaan": "Glukosa Puasa\neLFG (CKD-EPI)\nVitamin D 25-OH Total\nUrine Rutin\nTrigliserida\nRasio Chol.Total/Chol. HDL\nKreatinin\nHematologi Lengkap\nGPT\nGOT\nGamma GT\nCholesterol Total\nCholesterol LDL Direk\nCholesterol HDL\nAsam Urat", "harga": 1910000},
  {"nama": "WINHEALTH SIMPLE", "pemeriksaan": "Glukosa Puasa\neLFG (CKD-EPI)\nUrine Rutin\nTrigliserida\nRasio Chol.Total/Chol. HDL\nKreatinin\nHematologi Lengkap\nGPT\nGOT\nGamma GT\nCholesterol Total\nCholesterol LDL Direk\nAsam Urat\nCholesterol HDL", "harga": 1500000},
  {"nama": "PANEL SEXUAL TRANSMITTED INFECTION (STI 10) PCR", "pemeriksaan": "1. Chlamydia trachomatis (CT)\n2. Haemophilus ducreyi (HD)\n3. Herpes Simplex Virus - 1 (HSV-1)\n4. Herpes Simplex Virus - 2 (HSV-2)\n5. Mycoplasma genitalium (MG)\n6. Mycoplasma hominis (MH)\n7. Neisseria gonorrhoeae (NG)\n8. Treponema pallidum (TP)\n9. Trichomonas vaginalis (TV)\n10. Ureaplasma (urealyticum/parvum, UU-P)", "harga": 2605000},
  {"nama": "NARKOBA 5 JENIS", "pemeriksaan": "Ganja/Cannabis.Hash,Cimeng/Marijuana\nAmphetamine/shabu2/Ekstasi\nBenzodiazepin\nCocain/Benzoylecgonin\nOpiates/morfin/heroin/putaw", "harga": 1260000},
  {"nama": "BABYSITTER", "pemeriksaan": "Tanda Vital\nRontgen Thorax \nGlukosa Puasa\nFaeces Rutin\nHematologi Lengkap", "harga": 808000},
  {"nama": "CHECK UP MILLENIAL", "pemeriksaan": "Rontgen Thorax\nGlukosa Puasa\neLFG (CKD-EPI)\nVitamin D 25-OH Total\nUrine Rutin\nTrigliserida\nRasio Chol.Total/Chol. HDL\nKreatinin\nHematologi Rutin\nHBsAg\nGPT\nGOT\nGamma GT\nCholesterol Total\nCholesterol LDL Direk\nCholesterol HDL\nAsam Urat\nAnti-HCV\nIndeks Massa Tubuh\nLingkar Perut\nTekanan Darah", "harga": 3336000},
  {"nama": "CHOLESTEROL PLUS", "pemeriksaan": "Rasio Chol.Total/Chol. HDL\nTrigliserida\nRasio Chol. LDL Direk/Apo B\nCholesterol Total\nCholesterol LDL Direk\nCholesterol HDL\nApo-B", "harga": 863000},
  {"nama": "DEMENSIA", "pemeriksaan": "APOE-Genotipe\nGlukosa Puasa\neLFG (CKD-EPI)\nNa, K, Cl\nTSHs\nVitamin B12\nHematologi Lengkap\nKreatinin\nCalcium", "harga": 6084000},
  {"nama": "IBU HAMIL TRIMESTER 1", "pemeriksaan": "Glukosa Puasa\nSaran\nAnti-Toxoplasma IgM\nAnti-HIV\nVDRL/RPR\nUrine Rutin\nHematologi Lengkap\nHBsAg\nGolongan Darah A, B, O dan Rhesus\nAnti-Toxoplasma IgG\nAnti-Rubella IgM\nAnti-Rubella IgG\nAnti-CMV IgM\nAnti-CMV IgG", "harga": 5645000},
  {"nama": "IBU HAMIL TRIMESTER 2", "pemeriksaan": "Rasio Albumin - Kreatinin Urine Sewaktu\nVitamin D 25-OH Total\nUrine Rutin\nTSHs\nHematologi Rutin\nHbA1c\nProtein Total, Albumin , Globulin\nAnti-TPO", "harga": 3510000},
  {"nama": "IBU HAMIL TRIMESTER 3", "pemeriksaan": "Kultur Bakteri\nVitamin D 25-OH Total\nUrine Rutin\nHematologi Rutin\nFerritin", "harga": 2167000},
  {"nama": "IMUNITAS 3", "pemeriksaan": "Panel Vitamin B1 dan B6, LC-MS/MS\nOmega PROfile\nZn, Plasma\nSe, Plasma\nFe, Plasma\nVitamin D 25-OH Total\nVitamin B12\nVitamin A & E\nMagnesium\nAsam Folat", "harga": 8706000},
  {"nama": "INFEKSI MENULAR SEKSUAL PRIA PLUS", "pemeriksaan": "Anti-HSV1 & 2 IgM\nCT/NG-DNA (Real Time PCR)\nAnti-HIV\nVDRL/RPR\nTPHA\nPengecatan Gram\nAnti-Chlamydia trachomatis IgM\nAnti-Chlamydia trachomatis IgG", "harga": 4591000},
  {"nama": "INFEKSI MENULAR SEKSUAL WANITA PLUS", "pemeriksaan": "HPV-DNA High-Risk with 16/18 Genotype\nKesan\nAnti-HSV1 & 2 IgM\nCT/NG-DNA (Real Time PCR)\nPengecatan Gram (bacterial vaginosis)\nAnti-HIV\nVDRL/RPR\nTPHA\nAnti-Chlamydia trachomatis IgM\nAnti-Chlamydia trachomatis IgG", "harga": 5556000},
  {"nama": "JANTUNG SEHAT 3", "pemeriksaan": "Rasio Albumin - Kreatinin Urine Sewaktu\nhs-Troponin I (Kuantitatif)\nTrigliserida\nRasio Chol.Total/Chol. HDL\nRasio Chol. LDL Direk/Apo B\nLp(a)\nhs-CRP\nHomocysteine\nHbA1c\nCholesterol Total\nCholesterol LDL Direk\nCholesterol HDL\nApo-B", "harga": 4924000},
  {"nama": "MENTAL WELLNESS FEMALE COMPREHENSIVE", "pemeriksaan": "Amino Profile-21\nFree Cortisol, Saliva Pagi\nPanel Vitamin B1 dan B6, LC-MS/MS\nProHealthy Gut\nOmega PROfile\nGlukosa Puasa\nEstradiol\nZn, Plasma\nSe, Plasma\neLFG (CKD-EPI)\nVitamin D 25-OH Total\nVitamin B12\nTSHs\nTrigliserida\nRasio Chol.Total/Chol. HDL\nMagnesium\nKreatinin\nhs-CRP\nHomocysteine\nHematologi Lengkap\nHbA1c\nGPT\nGOT\nCholesterol Total\nCholesterol LDL Direk\nCholesterol HDL\nAsam Folat", "harga": 6700000},
  {"nama": "MENTAL WELLNESS MALE COMPREHENSIVE", "pemeriksaan": "hs-CRP\nHomocysteine\nHematologi Lengkap\nHbA1c\nGPT\nGOT\nCholesterol Total\nCholesterol LDL Direk\nCholesterol HDL\nAsam Folat\nAmino Profile-21\nFree Cortisol, Saliva Pagi\nPanel Vitamin B1 dan B6, LC-MS/MS\nProHealthy Gut\nOmega PROfile\nGlukosa Puasa\nZn, Plasma\nSe, Plasma\neLFG (CKD-EPI)\nVitamin D 25-OH Total\nVitamin B12\nTSHs\nTrigliserida\nTestosteron\nRasio Chol.Total/Chol. HDL\nMagnesium\nKreatinin", "harga": 7747000},
  {"nama": "POST-MENOPAUSE", "pemeriksaan": "HPV-DNA High-Risk with 16/18 Genotype\nSitologi Serviks Berbasis Cairan (SSBC)\nEstradiol\nTrigliserida\nRasio Chol.Total/Chol. HDL\nhs-CRP\nHbA1c\nCTx (C-Telopeptide)\nCholesterol Total\nCholesterol LDL Direk\nCholesterol HDL", "harga": 4537000},
  {"nama": "PRA PENSIUN EXECUTIVE", "pemeriksaan": "APOE-Genotipe\nGlukosa Puasa\neLFG Cys-C (CKD-EPI)\nVitamin D 25-OH Total\nTSHs\nTrigliserida\nRasio Chol.Total/Chol. HDL\nHematologi Lengkap\nHbA1c\nGPT\nGOT\nD-Dimer\nCystatin-C\nCholesterol Total\nCholesterol LDL Direk\nCholesterol HDL\nCalcium\nAlbumin", "harga": 3083000},
  {"nama": "PRA VAKSINASI HEPATITIS B", "pemeriksaan": "HBsAg \nAnti-HBs \nAnti-HBc \n", "harga": 1292000},
  {"nama": "PUBERTAS TERLAMBAT", "pemeriksaan": "Analisis Kromosom Darah (G-banding)\nEstradiol\nFSH\nLH\nTSHs\nTes Kehamilan\nProlactin", "harga": 6339000},
  {"nama": "SINDROM METABOLIK", "pemeriksaan": "Leptin\nGlukosa Puasa\nRasio Albumin - Kreatinin Urine Sewaktu\nhs-Troponin I (Kuantitatif)\neLFG Cys-C (CKD-EPI)\nTrigliserida\nRasio Chol.Total/Chol. HDL\nRasio Chol. LDL Direk/Apo B\nhs-CRP\nHbA1c\nGPT\nCystatin-C\nCholesterol Total\nCholesterol LDL Direk\nCholesterol HDL\nApo-B\nAdiponektin\nLingkar Perut\nTekanan Darah", "harga": 6120000},
  {"nama": "TUMBUH KEMBANG ANAK", "pemeriksaan": "Zn, Plasma\nVitamin D 25-OH Total\nVitamin A & E\nTSHs\nRetikulosit\nhs-CRP\nHematologi Lengkap\nGambaran Darah Tepi\nFree T4 (FT4)\nFerritin", "harga": 4866000},
  {"nama": "VEGETARIAN LENGKAP", "pemeriksaan": "eLFG Cys-C (CKD-EPI)\nVitamin D 25-OH Total\nVitamin B12\nTrigliserida\nRasio Chol.Total/Chol. HDL\nHematologi Lengkap\nHbA1c\nFerritin\nCystatin-C\nCholesterol Total\nCholesterol LDL Direk\nCholesterol HDL\nCalcium\nAsam Urat\nAsam Folat\nAlbumin", "harga": 2699000},
  {"nama": "WELLNESS ESSENTIAL", "pemeriksaan": "Glukosa Puasa\nRasio Albumin - Kreatinin Urine Sewaktu\neLFG (CKD-EPI)\nBilirubin (Total/Direk/Indirek)\nVitamin D 25-OH Total\nTrigliserida\nRasio Chol.Total/Chol. HDL\nKreatinin\nhs-CRP\nHematologi Lengkap\nHbA1c\nGPT\nGOT\nCholesterol Total\nCholesterol LDL Direk\nCholesterol HDL\nAsam Urat\nAnti-HBs\nIndeks Massa Tubuh\nLingkar Perut\nTekanan Darah", "harga": 3191000}
];
