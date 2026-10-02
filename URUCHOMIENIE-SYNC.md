# Uruchomienie Ortograficznych wyścigów: konta, synchronizacja i publikacja

Aplikacja może działać jako strona internetowa bez kupowania domeny. GitHub Pages może bezpłatnie publikować stronę z publicznego repozytorium na adresie `uzytkownik.github.io/nazwa-repozytorium`. Postępy uczniów zapisuje Supabase, a GitHub przechowuje kod aplikacji.

## 1. Repozytorium GitHub

Repozytorium projektu: <https://github.com/czasowstrzymywacz-a11y/ortograficzne-wyscigi>.
Po wysłaniu pierwszej wersji kolejne aktualizacje można wysyłać z folderu projektu:

```powershell
git add -A
git commit -m "Opis zmian"
git push -u origin main
```

Pierwsze wysłanie i konfigurację repozytorium przygotowuje opiekun projektu. GitHub może poprosić o zalogowanie w przeglądarce.

## 2. Włącz bezpłatną stronę

1. W repozytorium wybierz **Settings → Pages**.
2. W **Build and deployment** ustaw **Deploy from a branch**, gałąź `main`, folder `/ (root)` i zapisz.
3. Po chwili GitHub pokaże adres strony, zwykle `https://czasowstrzymywacz-a11y.github.io/ortograficzne-wyscigi/`.
4. Zmiany w kodzie publikujesz później poleceniami `git add .`, `git commit -m "Opis zmian"` i `git push`.

Strona źródłowa będzie publiczna. W kodzie znajduje się wyłącznie klucz Supabase przeznaczony do użycia w przeglądarce. Nie dodawaj do repozytorium klucza `Secret`/`service_role`, hasła do bazy ani plików `.env`.

## 3. Przygotuj Supabase

1. W projekcie `fnfplnlraskqrtdtjhyu` otwórz **SQL Editor → New query**.
2. Wklej całą zawartość pliku `supabase-sync.sql` i wybierz **Run**. Tworzy to profile uczniów, prywatne postępy, ograniczenie prób PIN-u oraz funkcję rankingu.
3. W folderze projektu otwórz PowerShell i zaloguj CLI Supabase:

```powershell
npx supabase login
```

4. Po zalogowaniu połącz projekt i opublikuj funkcję logowania:

```powershell
npx supabase link --project-ref fnfplnlraskqrtdtjhyu
npx supabase functions deploy student-auth --project-ref fnfplnlraskqrtdtjhyu
```

`supabase init` nie jest potrzebne — konfiguracja CLI i plik funkcji są już w tym folderze. Przy pierwszym linkowaniu CLI może poprosić o hasło bazy. Wpisz je bezpośrednio w terminalu Supabase; nie wysyłaj go w czacie ani nie zapisuj w repozytorium.

Funkcja używa klucza administracyjnego wyłącznie po stronie Supabase. Supabase udostępnia funkcjom klucze `SUPABASE_SECRET_KEYS` oraz `SUPABASE_PUBLISHABLE_KEYS`; kod obsługuje ten format. Klucza Secret nie umieszczaj w pliku strony. [Dokumentacja Supabase: sekrety funkcji](https://supabase.com/docs/guides/functions/secrets).

## 4. Jak uczniowie korzystają z kont

1. Uczeń wybiera w aplikacji **Utwórz konto**, wpisuje imię lub pseudonim oraz własny PIN z 4 cyfr.
2. Nazwa musi być unikalna; jeśli jest zajęta, uczeń wybiera inną. W rankingu widoczna będzie ta nazwa, więc najlepiej wpisać pseudonim, bez nazwiska.
3. Przy pierwszym logowaniu aplikacja przenosi dotychczasowe wyniki z tej przeglądarki do nowego konta. Na telefonie lub innym urządzeniu uczeń loguje się tą samą nazwą i PIN-em.
4. Każde konto zapisuje osobne postępy. Rankingi pokazują nazwę i zagregowany wynik, nie listę dyktand.

PIN ma tylko 10 000 możliwych kombinacji, więc funkcja ogranicza próby logowania i rejestracji. PIN nie jest samodzielnym zabezpieczeniem dla wrażliwych danych. Uczeń bez e-maila nie ma automatycznego odzyskiwania zapomnianego PIN-u. Opiekun powinien pomóc zapisać PIN w bezpiecznym miejscu.

## 5. Co jest już przygotowane

- logowanie i samodzielne zakładanie konta imieniem/pseudonimem oraz PIN-em;
- synchronizacja osiągnięć między urządzeniami;
- zakładka rankingów z sześcioma kategoriami, podium zwycięzcy i medalami;
- dodatkowe odznaki za treningi, opanowane słowa, celność i serię;
- większa baza słów, wyszukiwarka oraz dobieranie kolejnych ćwiczeń z tej bazy.

GitHub Pages jest dostępny bezpłatnie dla publicznych repozytoriów na planie GitHub Free. [Dokumentacja GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages).
