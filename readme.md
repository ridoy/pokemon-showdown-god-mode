<p align="center">
  <img src="https://github.com/ridoy/ps_godmode/blob/main/alphademo2.png" height="500px">
  </p>

Not quite yet ready for public usage. Only works for Generation 7 Random Battles so far.

# Setup instructions

1. Download as ZIP
2. Unzip
3. Visit `chrome://extensions`
4. Click "Developer Mode"
5. Click "Load unpacked" and select folder

# Checklist

Moving this to `issue-tracker.md` in the root folder.

- [x] Damage calculation of your active Pokemon's moves
- [x] Damage calculation of your entire party's moves (to aid in switch-ins)
- [x] Damage calculation of your opponent's moves (which are known in Randbats) on your active Pokemon
- [x] Damage calculation of your opponent's moves on your party (to aid in safe switch-ins)
- [ ] Don't require reloading the page for every battle
- [ ] Consider field and opponent's potential abilities in damage calculation. Consider possible items.
- [ ] Add support for other generations (involves importing random battle movesets from each gen, and determining the generation of a new battle once it's begun)
