# Wersje i publikacja

- Numer wydania jest w `version.json`. Ten sam numer musi być widoczny w nagłówku strony i w metadanych `index.html`.
- Obecne wydanie to 0.5. Przy każdej kolejnej opublikowanej aktualizacji uruchom `./Update-Version.ps1` bez argumentów dokładnie raz, po zakończeniu zmian. Skrypt zwiększa numer: 0.5 → 0.6 → 0.7, itd.
- Nie zwiększaj wersji przy samej analizie, zmianach roboczych ani ponowieniu nieudanego wysłania tego samego wydania. Przy świadomym ustawieniu numeru użyj parametru `-Version`.
- Do repozytorium publikacyjnego przenieś razem `index.html`, `version.json`, `Update-Version.ps1` i ten plik. Jeśli istnieje `.publish-stage`, to obecny klon służący do publikacji.
- Użytkownik upoważnił do publikowania gotowych aktualizacji w istniejącym repozytorium GitHub Pages.
- Nazwę aplikacji zmień wyłącznie po zatwierdzeniu konkretnej nazwy przez użytkownika. Propozycje nazw i usprawnień nie stanowią zgody na ich wdrożenie.
