#!/bin/zsh
cd -- "${0:A:h}" || exit 1
print 'Прототип: http://127.0.0.1:4173/'
print 'Остановка: Ctrl+C'
python3 -m http.server 4173 --bind 127.0.0.1
