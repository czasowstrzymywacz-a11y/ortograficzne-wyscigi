# Uruchomienie Ortograficznych wyścigów: konta e-mail, synchronizacja i publikacja

Aplikacja może działać jako strona internetowa bez kupowania domeny. GitHub Pages publikuje stronę z repozytorium, a Supabase przechowuje konta, prywatne postępy uczniów i dane rankingów.

## Repozytorium i strona

Repozytorium projektu: <https://github.com/czasowstrzymywacz-a11y/ortograficzne-wyscigi>.
Adres strony: <https://czasowstrzymywacz-a11y.github.io/ortograficzne-wyscigi/>.
Po skonfigurowaniu repozytorium aktualizacje wysyła się z folderu projektu:

```powershell
git add -A
git commit -m "Opis zmian"
git push
```

W GitHub wybierz **Settings → Pages → Deploy from a branch**, gałąź `main`, folder `/ (root)`. Nie publikuj kluczy `service_role`/Secret, hasła do bazy ani plików `.env`. Klucz publishable/anon w kodzie przeglądarki jest publiczny; dostęp do danych kontrolują zasady RLS.

## Supabase — konfiguracja e-mail

1. W projekcie Supabase powiązanym ze stroną otwórz **Authentication → URL Configuration**.
2. Ustaw **Site URL** na `https://czasowstrzymywacz-a11y.github.io/ortograficzne-wyscigi/`.
3. Dodaj ten sam adres do **Redirect URLs** (w razie potrzeby także `https://czasowstrzymywacz-a11y.github.io/ortograficzne-wyscigi/**`).
4. W **Authentication → Providers → Email** włącz Email. Potwierdzanie adresów może pozostać włączone: uczeń kliknie link w skrzynce, a potem zaloguje się tym samym adresem i hasłem. Dostosuj szablon potwierdzenia, jeśli trzeba.
5. Otwórz **SQL Editor**, wklej zawartość `supabase-sync.sql` i wybierz **Run**. Skrypt bezpiecznie tworzy tabele, zasady dostępu, profil rankingowy i funkcję rankingu. Można go uruchamiać ponownie po aktualizacjach.
6. W `index.html` sprawdź `window.ISKIERKA_SYNC_CONFIG`: adres projektu i klucz publishable/anon muszą należeć do tego samego projektu Supabase, w którym uruchomiono SQL.

Supabase Auth obsługuje tworzenie kont i logowanie bez wdrażania funkcji `student-auth`. Nie wpisuj do aplikacji żadnych kluczy administracyjnych.

## Konta i rankingi

Uczeń zakłada konto adresem e-mail i hasłem (co najmniej 8 znaków) oraz wybiera imię lub pseudonim 2–24 znaków. Tylko ten pseudonim jest pokazany w rankingach. Jeśli włączone jest potwierdzenie adresu, najpierw trzeba kliknąć link otrzymany e-mailem, a następnie zalogować się.

Po zalogowaniu aplikacja tworzy profil rankingowy i synchronizuje postępy między urządzeniami. Pierwsze logowanie nowego konta przenosi zapis z bieżącej przeglądarki. Rankingi pokazują sześć kategorii równocześnie; odczyt publicznych zestawień obsługuje funkcja SQL `get_leaderboard`, a dane uczniów chronią polityki RLS.

Uczniowie, którzy wcześniej korzystali z kont PIN, muszą utworzyć konto e-mail. Stare postępy pozostają na starym koncie PIN i nie są automatycznie łączone z nowym adresem.

### Lista zawodników i dostępność

Nowa wersja dodaje do Rankingi listę kont z pseudonimem oraz zieloną kropką przy osobach aktywnych. Aby ją włączyć w istniejącym projekcie, w Supabase otwórz **SQL Editor**, uruchom plik `supabase/migrations/202610060001_student_roster.sql`, a następnie odśwież aplikację. Funkcja udostępnia wyłącznie identyfikator konta i pseudonim zalogowanym uczniom; status aktywności jest chwilowy i przekazywany kanałem Realtime, nie jest zapisywany w historii.

W aplikacji użytkownik może też wybrać tryb nocny przyciskiem w górnym pasku. Ustawienie zapamiętuje się na danym urządzeniu.
