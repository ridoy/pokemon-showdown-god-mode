<p align="center">
  <img src="https://github.com/ridoy/pokemon-showdown-god-mode/blob/main/img/alphademo2.png" height="500px">
  </p>

Not quite yet ready for public usage. Only works for Generation 7 Random Battles so far.

# Setup instructions

1. Download as ZIP
2. Unzip
3. Visit `chrome://extensions`
4. Click "Developer Mode"
5. Click "Load unpacked" and select folder

# Issue Tracker

Because using the Github issue tracker feels too fancy for now.

## Functionality
~~F1 Adjustable slideout for damage container~~

F2 Elegant UI for considering possible enemy items, abilities, terrain

F3 Elegant UI for entire matrix of matchups

F4 Add other generations (this is crucial if I ever want anyone to use this tool)

F5 Add support for other generations and game modes

## Bugs
~~B1 Regional form bugs~~

B2 include Z moves in calculations

~~B3 Slideout messes up when battle starts~~

B4 Hidden Power and Return is serialized as hiddenpower{type}60 and return102 respectively. Thus damage is calculated as 0.

~~B5 Refresh is required for every new battle~~

B6 Sometimes calculations aren't totally accurate and I don't know why.

B7 Aegislash bug ?

## Maintenance

M1 Why am I not using any jquery lol

~~M2 Clean up damage calculation since that is where the majority of the action happens~~

M3 Automated testing.