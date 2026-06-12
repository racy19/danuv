import { Note } from "../../../shared/types/notes";

export const defaultSharedNotes: Record<number, Note> = {
    1: { id: 1, title: "Nákupní seznam", content: "- Mléko\n- Chleba\n- Máslo\n- Jablka", type: 'text', isPinned: true },
    2: { id: 2, title: "Přístupové údaje WiFi", content: "SSID: Home_Sweet_Home\nPass: 12345678", type: 'text', isPinned: true },
    3: { id: 3, title: "Úřední hodiny", content: "Na obecním úřadě jsou v časy 08:00 - 12:00, 13:00 - 17:00", type: 'text', isPinned: false },
    4: { id: 4, title: "Ceník svozu", content: "nádoba 120 litrů 1x za 14 dní (26 svozů) 1 560,- Kč/rok", type: 'text', isPinned: false },
    5: { id: 5, title: "Rozměry koupelny", content: "Výška: 250cm\nŠířka: 180cm\nDélka: 220cm", type: 'text', isPinned: false },
    6: { id: 6, title: "Inspirace Koupelna", content: "Odkaz na Pinterest nástěnku: https://pinterest.com/...\nStyl: Moderní, Beton, černé baterie", type: 'text', isPinned: false },
    7: { id: 7, title: "Rozpočet Rekonstrukce", content: "Celkový limit: 200 000 Kč\nUtraceno: 50 000 Kč\nZbývá: 150 000 Kč", type: 'text', isPinned: false },
    8: { id: 8, title: "Motivační dopis - šablona", content: "Vážený pane/paní,\n\nzaujala mě vaše nabídka a věřím, že mé zkušenosti s...", type: 'text', isPinned: false },
    9: { id: 9, title: "Seznam firem", content: "1. Google\n2. Microsoft\n3. Seznam.cz\n4. Avast", type: 'text', isPinned: false },
    10: { id: 10, title: "Rozměry skříně PAX", content: "Šířka: 100cm\nHloubka: 58cm\nVýška: 236cm\nBarva: Bílá", type: 'text', isPinned: false },
    20: { id: 20, title: "Nezapomenout na vstupní dveře", content: "", type: 'heading', isPinned: false },
    21: { id: 21, title: "Topení - info", content: "Zkontrolovat tlak a odvzdušnit.", type: 'text', isPinned: false },
    22: { id: 22, title: "Odpady - nákup", content: "Koupit nový sifon.", type: 'text', isPinned: false },
    23: { id: 23, title: "Důležité kontakty", content: "", type: 'heading', isPinned: false },
    24: { id: 24, title: "Nápady na dárky", content: "", type: 'heading', isPinned: false },
    30: { id: 30, title: "Trasa: Lesní cesta", content: "Druhý den poběžíme stínem přes les, ať pošetříme síly.", type: 'text', isPinned: false },
    31: { id: 31, title: "Nákup: Minerálky", content: "Cestou zpět koupit magnesii, dochází zásoby.", type: 'text', isPinned: false },
    40: { id: 40, title: "Poslední lekce", content: "Nezapomenout se rozloučit a vrátit materiály.", type: 'text', isPinned: false },
    99: { id: 99, title: "Tajný seznam dárků", content: "Pro babičku: Kniha\nPro dědu: Papuče", type: 'text', isPinned: false, isHidden: true }
};