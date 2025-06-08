# Time Manager

Internetowa aplikacja do zarządzania czasem, która pomaga użytkownikom tworzyć i weryfikować codzienne harmonogramy. Zbudowana z użyciem frontendu w JavaScript i walidacji harmonogramów w oparciu o Prologa.

## Funkcje

- Dodawanie i zarządzanie codziennymi aktywnościami z podaniem nazwy, typu (praca/odpoczynek), godziny rozpoczęcia, godzina zakończenia i ważności
- Wizualna reprezentacja harmonogramu dnia na osi czasu
- Automatyczna walidacja harmonogramu za pomocą reguł Prologa:
  - Wykrywanie konfliktów czasowych
  - Analiza czasu na odpoczynek
  - Wykrywanie podobnych nazw aktywności
- Codzienne statystyki (proporcja pracy do odpoczynku, całkowity czas)
- Opcja pobranie swojego planu dnia w formie czytelnego pliku tekstowego

## Wymagania wstępne

- Node.js (w wersji 14 lub wyższej)
- SWI-Prolog (najnowsza wersja)
- Nowoczesna przeglądarka internetowa


## Uruchamianie aplikacji

1. Uruchom serwer:
```bash
npm start
```

2. Otwórz przeglądarkę i przejdź do:
```
http://localhost:3000
```

## Użytkowanie

1. Dodaj aktywności za pomocą formularza:
   - Wprowadź nazwę aktywności
   - Wybierz typ (praca/odpoczynek)
   - Ustaw godzinę rozpoczęcia
   - Ustaw godzine zakończenia
   - Oceń ważność (od 1 do 5)

2. Przeglądaj harmonogram na osi czasu i w widoku listy

3. Sprawdź wyniki walidacji pod kątem:
   - Konfliktów czasowych
   - Ostrzeżeń dotyczących odpoczynku
   - Podobnych nazw aktywności
   - Propozycji ulepszeń harmonogramu

4. Monitoruj codzienne statystyki dotyczące równowagi między pracą a odpoczynkiem

5. Szybko usuwaj lub edytuj aktywności, jeżeli to potrzebne

## Struktura projektu

```
time_manager/
├── public/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── server.js
├── validator.pl
├── package.json
└── README.md
```

## Szczegóły techniczne

- Frontend: czysty JavaScript, HTML5, CSS3
- Backend: Node.js z użyciem Express
- Walidacja: SWI-Prolog
- Komunikacja: REST API