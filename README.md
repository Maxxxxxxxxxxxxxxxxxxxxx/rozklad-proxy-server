# Serwer pośredniczący — tablica odjazdów ZTM

Reverse proxy między aplikacją frontendową a otwartym API ZTM (CKAN).
Cyklicznie pobiera odjazdy dla obsługiwanych przystanków, buforuje je w MongoDB i udostępnia aplikacjom klienckim.
Dzięki temu liczba zapytań do ZTM zależy od liczby przystanków, a nie od liczby podłączonych monitorów.

## Uruchomienie przez Docker Compose (zalecane)

Najprostsza droga — podnosi jednocześnie aplikację i bazę danych, bez instalowania czegokolwiek lokalnie.

```bash
# 1. utwórz plik .env (opis zmiennych niżej)
# 2. zbuduj i uruchom
docker compose up -d --build
```

Startują dwa kontenery: `rozklad_reverse_proxy` (aplikacja, port 3000) oraz `rozklad_mongodb` (baza, port 27017, z wolumenem zachowującym dane między uruchomieniami). Oba restartują się automatycznie.

```bash
docker compose logs -f api   # podgląd logów
docker compose down          # zatrzymanie
```

## Uruchomienie lokalne (bez Dockera)

Wymaga **Bun 1.1+** oraz działającej instancji **MongoDB**.

```bash
bun install
bun run dev
```

> **Uwaga:** przy uruchomieniu lokalnym `MONGO_URI` musi wskazywać na `localhost`, a nie na nazwę usługi z Compose:
> `mongodb://localhost:27017/rozklad` zamiast `mongodb://mongodb:27017/rozklad`.

## Zmienne środowiskowe

Wszystkie odczytywane są z pliku `.env` w katalogu projektu (Compose podaje go kontenerowi przez `env_file`).

| Zmienna | Wymagana | Domyślnie | Znaczenie |
|---|---|---|---|
| `CKAN_DEPARTURES_URL` | tak | — | Adres zasobu z estymowanymi czasami odjazdów. Serwer dokleja do niego `?stopId=...`. Produkcyjnie: `https://ckan2.multimediagdansk.pl/departures` |
| `ALLOWED_HOSTS` | tak (poza trybem dev) | — | Lista źródeł dopuszczonych przez CORS, rozdzielona przecinkami, np. `http://localhost:5173,http://tablica-a1:5173`. Każdy wpis musi być pełnym originem: schemat + host + port, bez ukośnika na końcu. W trybie `development` pomijana — CORS przyjmuje wtedy `*` |
| `AUTH_ENCRYPTION_KEY` | tak | — | Klucz szyfrujący ciasteczko sesji. Musi mieć **co najmniej 32 znaki** |
| `MONGO_URI` | nie | `mongodb://localhost:27017/rozklad` | Adres bazy. W Compose: `mongodb://mongodb:27017/rozklad` |
| `PORT` | nie | `3000` | Port nasłuchu aplikacji |
| `NODE_ENV` | nie | — | Wartość `development` włącza tryb deweloperski: CORS przyjmuje żądania z dowolnego źródła (`*`) |
| `ADMIN_PASSWORD` | nie | `admin` | Hasło do panelu administracyjnego. **Zmień przed wdrożeniem** |
| `POLL_INTERVAL_SECONDS` | nie | `30` | Co ile sekund serwer odpytuje API ZTM |
| `STALE_STOP_THRESHOLD_MINUTES` | nie | `2` | Po ilu minutach bez zapytań przystanek uznawany jest za nieaktywny i usuwany wraz z danymi |
| `STALE_STOP_CLEANUP_INTERVAL_SECONDS` | nie | `30` | Co ile sekund uruchamiane jest sprzątanie nieaktywnych przystanków |

Przykładowy `.env`:

```env
CKAN_DEPARTURES_URL=https://ckan2.multimediagdansk.pl/departures
ALLOWED_HOSTS=http://localhost:5173,http://tablica-a1:5173
AUTH_ENCRYPTION_KEY=<losowy ciąg min. 32 znaków>
MONGO_URI=mongodb://mongodb:27017/rozklad
ADMIN_PASSWORD=<własne hasło>
POLL_INTERVAL_SECONDS=30
STALE_STOP_THRESHOLD_MINUTES=2
STALE_STOP_CLEANUP_INTERVAL_SECONDS=30
```

## Interfejs API

| Metoda | Ścieżka | Opis |
|---|---|---|
| `GET` | `/departures?stopId=<id>` | Zbuforowane odjazdy dla stanowiska. Pierwsze zapytanie o nieznany przystanek rejestruje go i zwraca pustą listę — dane pojawią się po najbliższym cyklu odpytywania |
| `POST` | `/auth/login` | Logowanie hasłem administratora (`{ "password": "..." }`) |
| `POST` | `/auth/logout` | Wylogowanie |

## Skrypty

| Polecenie | Działanie |
|---|---|
| `bun run dev` | serwer deweloperski z hot reloadem |
| `bun run build` | kompilacja TypeScript do `dist/` |
| `bun run prettier:check` | sprawdzenie formatowania |
| `bun run prettier:fix` | poprawa formatowania |
