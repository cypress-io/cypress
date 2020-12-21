import { createCrossword } from '@/utils'
import { mapValues } from 'lodash'

export default mapValues({
  previousCrossword: {
    "acrossmap": null,
    "admin": false,
    "answers": {
      "across": ["ANDES", "SNIDE", "SALE", "HIREE", "NORSE", "EMIT", "OVERTHEHILL", "LASH", "YEA", "SARIS", "EFILE", "AROUNDTHECORNER", "UPS", "LANE", "ASKTO", "SPLIT", "LARA", "BEYONDTHEHORIZON", "CALF", "ERITU", "EATEN", "SINO", "LMN", "UNDERTHECOUNTER", "LIRAS", "DOULA", "MEA", "TKOS", "SIGHTUNSEEN", "REPO", "ADEAR", "TORSO", "ASSN", "CARNE", "STYES"],
      "down": ["AHOY", "NIVEA", "DREAR", "EER", "SETSUPON", "SNERD", "NOHIT", "IRISH", "DSL", "EEL", "SELFRELIANT", "AMAIN", "LISLE", "ETHER", "HANS", "EON", "OUTOFSEASON", "ELIHU", "CATO", "ABC", "SEA", "KYL", "STROH", "PHI", "LET", "AZT", "ROE", "ANN", "DENT", "REMNANTS", "IRS", "LULU", "ULTRA", "NIKES", "DROPS", "EDGER", "COHAN", "OUTRE", "EMERY", "REESE", "ANOS", "SAC", "IDA", "SOT"]
    },
    "author": "Paula Gamache",
    "autowrap": null,
    "bbars": null,
    "circles": null,
    "clues": {
      "across": ["1. Peaks of Peru", "6. Not nice, as a comment", "11. \"Prices slashed!\" event", "15. One just put on the payroll", "16. Like Odin and Thor", "17. Give off", "18. Elderly, so to speak", "20. Mascara coats it", "21. Vote of support", "22. Bollywood wraps", "23. Submit a tax return via computer", "24. Soon to arrive", "28. FedEx competitor", "29. Bowler's assignment", "30. Send an invitation for", "33. Remaining 7 and 10 pins in bowling", "36. \"___ Croft: Tomb Raider\"", "40. Pulitzer-winning 1920 Eugene O'Neill play", "43. Baby bovine", "44. Verdi aria", "45. All gone from one's plate", "46. ___-Soviet relations", "48. Trio between K and O", "49. Secret or illegal", "57. Bygone Italian coins", "58. One providing nonmedical support for a woman in labor", "59. ___ culpa", "61. Some boxing results, for short", "62. Literal description of something that is 18-, 24-, 40- or 49-Across", "65. \"___ Man\" (Emilio Estevez film)", "66. \"Please be ___ and help me\"", "67. Human trunk", "68. The second \"A\" in N.C.A.A.: Abbr.", "69. Chili con ___", "70. Eyelid inflammations"],
      "down": ["1. Cry to a matey", "2. Skin care brand", "3. Gloomy, to a bard", "4. Suffix with puppet", "5. Attacks vigorously", "6. Mortimer voiced by Edgar Bergen", "7. Like a pitcher's perfect game", "8. Notre Dame's Fighting ___", "9. Broadband inits.", "10. Reef wriggler", "11. Not needing anyone's help", "12. With full force", "13. Smooth cotton fabric", "14. Air up there", "19. Brinker on skates", "23. Forever and a day", "25. Like melons in spring, e.g.", "26. Statesman Root", "27. Ancient Rome's ___ the Elder", "30. Diane Sawyer's network", "31. Aegean, e.g.", "32. Arizona senator Jon", "33. Old Detroit brewery name", "34. ___ Beta Kappa", "35. Tennis do-over", "37. AIDS treatment drug", "38. ___ v. Wade", "39. ___ Arbor, Mich.", "41. Fender ding", "42. Fabric leftovers", "47. Form 1040 org.", "48. Humdinger", "49. The \"U\" in UHF", "50. Shoes with swooshes", "51. Plummets", "52. Lawn trimmer", "53. George M. ___, \"The Yankee Doodle Boy\" composer", "54. Unconventional and then some", "55. Manicurist's file", "56. Pee Wee of the 1940s-'50s Dodgers", "60. Years in Mexico", "62. Cul-de-___", "63. Its capital is Boise: Abbr.", "64. Boozehound"]
    },
    "code": null,
    "copyright": "2012, The New York Times",
    "date": "1\/2\/2012",
    "dow": "Monday",
    "downmap": null,
    "editor": "Will Shortz",
    "grid": ["A", "N", "D", "E", "S", ".", "S", "N", "I", "D", "E", ".", "S", "A", "L", "E", "H", "I", "R", "E", "E", ".", "N", "O", "R", "S", "E", ".", "E", "M", "I", "T", "O", "V", "E", "R", "T", "H", "E", "H", "I", "L", "L", ".", "L", "A", "S", "H", "Y", "E", "A", ".", "S", "A", "R", "I", "S", ".", ".", "E", "F", "I", "L", "E", ".", "A", "R", "O", "U", "N", "D", "T", "H", "E", "C", "O", "R", "N", "E", "R", ".", ".", ".", "U", "P", "S", ".", ".", ".", "L", "A", "N", "E", ".", ".", ".", "A", "S", "K", "T", "O", ".", "S", "P", "L", "I", "T", ".", "L", "A", "R", "A", "B", "E", "Y", "O", "N", "D", "T", "H", "E", "H", "O", "R", "I", "Z", "O", "N", "C", "A", "L", "F", ".", "E", "R", "I", "T", "U", ".", "E", "A", "T", "E", "N", ".", ".", ".", "S", "I", "N", "O", ".", ".", ".", "L", "M", "N", ".", ".", ".", "U", "N", "D", "E", "R", "T", "H", "E", "C", "O", "U", "N", "T", "E", "R", ".", "L", "I", "R", "A", "S", ".", ".", "D", "O", "U", "L", "A", ".", "M", "E", "A", "T", "K", "O", "S", ".", "S", "I", "G", "H", "T", "U", "N", "S", "E", "E", "N", "R", "E", "P", "O", ".", "A", "D", "E", "A", "R", ".", "T", "O", "R", "S", "O", "A", "S", "S", "N", ".", "C", "A", "R", "N", "E", ".", "S", "T", "Y", "E", "S"],
    "gridnums": [1, 2, 3, 4, 5, 0, 6, 7, 8, 9, 10, 0, 11, 12, 13, 14, 15, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 17, 0, 0, 0, 18, 0, 0, 0, 0, 19, 0, 0, 0, 0, 0, 0, 20, 0, 0, 0, 21, 0, 0, 0, 22, 0, 0, 0, 0, 0, 0, 23, 0, 0, 0, 0, 0, 24, 0, 25, 0, 0, 0, 0, 0, 26, 27, 0, 0, 0, 0, 0, 0, 0, 0, 28, 0, 0, 0, 0, 0, 29, 0, 0, 0, 0, 0, 0, 30, 31, 32, 0, 0, 0, 33, 34, 35, 0, 0, 0, 36, 37, 38, 39, 40, 0, 0, 0, 0, 41, 0, 0, 0, 0, 0, 42, 0, 0, 0, 0, 43, 0, 0, 0, 0, 44, 0, 0, 0, 0, 0, 45, 0, 0, 0, 0, 0, 0, 0, 46, 47, 0, 0, 0, 0, 0, 48, 0, 0, 0, 0, 0, 49, 50, 51, 0, 0, 0, 0, 52, 53, 54, 0, 0, 0, 55, 56, 0, 57, 0, 0, 0, 0, 0, 0, 58, 0, 0, 0, 0, 0, 59, 0, 60, 61, 0, 0, 0, 0, 62, 63, 0, 0, 0, 0, 0, 64, 0, 0, 0, 65, 0, 0, 0, 0, 66, 0, 0, 0, 0, 0, 67, 0, 0, 0, 0, 68, 0, 0, 0, 0, 69, 0, 0, 0, 0, 0, 70, 0, 0, 0, 0],
    "hold": null,
    "id": null,
    "id2": null,
    "interpretcolors": null,
    "jnotes": null,
    "key": null,
    "mini": null,
    "notepad": null,
    "publisher": "The New York Times",
    "rbars": null,
    "shadecircles": null,
    "size": { "cols": 16, "rows": 15 },
    "title": "NY TIMES, MON, JAN 02, 2012",
    "track": null,
    "type": null
  },
  nextCrossword: {
    "acrossmap": null,
    "admin": false,
    "answers": {
      "across": ["SMOKE", "MISS", "OPUS", "CIVIL", "ITSABLAST", "ICONS", "NEWGUINEA", "ORIGAMI", "ADVERB", "NODS", "OMAR", "GELS", "OHI", "DENE", "REALESTATETAXES", "PRIVATEPRACTICE", "MADERESTITUTION", "STARTSSOMETHING", "STIR", "NSA", "SASH", "ESAU", "TBAR", "ONECAR", "SPAREME", "TOGAPARTY", "LATEX", "BRIDETOBE", "ATONE", "SESS", "STAT", "SENDS"],
      "down": ["SCION", "MICRO", "OVOID", "KINGSOLVER", "ELSA", "MINIM", "ITE", "SSW", "SAGA", "OLIVE", "PANEL", "USERS", "STAB", "BUDGETCUTS", "MOISTEST", "ADAPTORS", "RETRIM", "HEARTSHAPE", "NEATENUP", "RPMS", "ERAT", "AIDA", "TESSIE", "ATTHATRATE", "XIII", "ECON", "SENG", "SNORE", "AEGIS", "SCADS", "ASYET", "BETON", "AMEND", "REXES", "OTBS", "RATS", "ALAS", "ROT", "TBA"]
    },
    "author": "Joe Krozel",
    "autowrap": null,
    "bbars": null,
    "circles": null,
    "clues": {
      "across": ["1. Sign of engine trouble", "6. What a 61-Across will be called for only a little while longer", "10. One on a Liszt list", "14. Like some suits", "15. \"This shindig rocks!\"", "17. Computer screenful", "18. Part of Melanesia", "19. Subject for a folder", "21. Always or sometimes, say", "22. Approvals", "23. \"The thoughtful soul to solitude retires\" poet", "26. Gets set", "27. \"___ dunno ...\"", "29. Sandy tract by the sea, to a Brit", "31. They're often placed on parcels", "39. Lawyer's setup?", "40. Righted wrongs", "41. Picks a fight", "42. Rustle", "43. Wiretapping grp.", "44. Accessory that may have a state name on it", "47. Old Testament \"man of the field\"", "49. Lift, of a sort", "53. Like many garages", "55. Excuse-interrupting comment", "57. Occasion to put on sheets", "60. Primer option", "61. Shower head?", "62. Right wrongs", "63. Psychiatrist's appt.", "64. Turnovers, e.g.", "65. Posts"],
      "down": ["1. Offshoot", "2. Start that conveys very little?", "3. Like prickly pears", "4. Novelist whose character Adah speaks in palindromes", "5. Four-footed orphan of literature", "6. Half note, in Britain", "7. -nik kin", "8. Yemen-to-Zimbabwe dir.", "9. Continuing drama", "10. Food item often cut into rings", "11. Setting for instruments", "12. ___ manual", "13. Skewer", "16. Belt tightenings", "20. Like the best chicken or turkey, say", "24. Electrical accessories", "25. Crop further", "28. Feature of many a box of chocolates", "30. Unclutter", "31. CD rate?", "32. \"Hoc ___ in votis\"", "33. Slave singing several solos", "34. Red Sox anthem", "35. \"If things were to continue thus ...\"", "36. Number of one of the Olympics canceled due to W.W. II", "37. Study of some bubbles?: Abbr.", "38. Hong Kong's Hang ___ index", "44. Large bore", "45. Umbrella", "46. Oodles", "48. Heretofore", "50. Back with bread", "51. Improve", "52. Curly-furred cats", "53. Parlors with TV screens: Abbr.", "54. Experiment runners?", "56. \"Oh, cruel world ...\"", "58. Bushwa", "59. Sched. letters"]
    },
    "code": null,
    "copyright": "2011, The New York Times",
    "date": "12\/31\/2011",
    "dow": "Saturday",
    "downmap": null,
    "editor": "Will Shortz",
    "grid": ["S", "M", "O", "K", "E", ".", "M", "I", "S", "S", ".", "O", "P", "U", "S", "C", "I", "V", "I", "L", ".", "I", "T", "S", "A", "B", "L", "A", "S", "T", "I", "C", "O", "N", "S", ".", "N", "E", "W", "G", "U", "I", "N", "E", "A", "O", "R", "I", "G", "A", "M", "I", ".", ".", "A", "D", "V", "E", "R", "B", "N", "O", "D", "S", ".", "O", "M", "A", "R", ".", "G", "E", "L", "S", ".", ".", ".", ".", "O", "H", "I", ".", "D", "E", "N", "E", ".", ".", ".", ".", "R", "E", "A", "L", "E", "S", "T", "A", "T", "E", "T", "A", "X", "E", "S", "P", "R", "I", "V", "A", "T", "E", "P", "R", "A", "C", "T", "I", "C", "E", "M", "A", "D", "E", "R", "E", "S", "T", "I", "T", "U", "T", "I", "O", "N", "S", "T", "A", "R", "T", "S", "S", "O", "M", "E", "T", "H", "I", "N", "G", ".", ".", ".", ".", "S", "T", "I", "R", ".", "N", "S", "A", ".", ".", ".", ".", "S", "A", "S", "H", ".", "E", "S", "A", "U", ".", "T", "B", "A", "R", "O", "N", "E", "C", "A", "R", ".", ".", "S", "P", "A", "R", "E", "M", "E", "T", "O", "G", "A", "P", "A", "R", "T", "Y", ".", "L", "A", "T", "E", "X", "B", "R", "I", "D", "E", "T", "O", "B", "E", ".", "A", "T", "O", "N", "E", "S", "E", "S", "S", ".", "S", "T", "A", "T", ".", "S", "E", "N", "D", "S"],
    "gridnums": [1, 2, 3, 4, 5, 0, 6, 7, 8, 9, 0, 10, 11, 12, 13, 14, 0, 0, 0, 0, 0, 15, 0, 0, 0, 16, 0, 0, 0, 0, 17, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 19, 0, 0, 0, 0, 20, 0, 0, 0, 21, 0, 0, 0, 0, 0, 22, 0, 0, 0, 0, 23, 0, 24, 25, 0, 26, 0, 0, 0, 0, 0, 0, 0, 27, 28, 0, 0, 29, 0, 30, 0, 0, 0, 0, 0, 31, 32, 33, 0, 0, 0, 34, 0, 0, 0, 0, 35, 36, 37, 38, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 40, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 41, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 42, 0, 0, 0, 0, 43, 0, 0, 0, 0, 0, 0, 44, 45, 46, 0, 0, 47, 0, 48, 0, 0, 49, 50, 51, 52, 53, 0, 0, 0, 0, 54, 0, 0, 55, 0, 56, 0, 0, 0, 0, 57, 0, 0, 0, 0, 0, 58, 59, 0, 0, 60, 0, 0, 0, 0, 61, 0, 0, 0, 0, 0, 0, 0, 0, 0, 62, 0, 0, 0, 0, 63, 0, 0, 0, 0, 64, 0, 0, 0, 0, 65, 0, 0, 0, 0],
    "hold": null,
    "id": null,
    "id2": null,
    "interpretcolors": null,
    "jnotes": "Mr. Krozel made two versions of this puzzle. The companion triple-stack grid contains 3\/4 of the <em>same<\/em> quad-stack plus black squares in all the same places. <a href=\"http:\/\/www.xwordinfo.com\/images\/grids\/JKCompare.gif\">You can see the two grids together here<\/a>.",
    "key": null,
    "mini": null,
    "notepad": null,
    "publisher": "The New York Times",
    "rbars": null,
    "shadecircles": null,
    "size": { "cols": 15, "rows": 16 },
    "title": "NY TIMES, SAT, DEC 31, 2011",
    "track": null,
    "type": null
  },
  crossword: {
    "acrossmap": null,
    "admin": false,
    "answers": {
      "across": ["PHDS", "SARAN", "PBJ", "ABEAM", "SEEIFICAROM", "OUI", "GOLDA", "HYPNOTICTRANSOM", "AGAIN", "AJA", "RODE", "VEIN", "STAYED", "WORSEN", "STEMTOSTERNUM", "ETAL", "STERNO", "HOSTESS", "GETAWAY", "VOW", "CAP", "GALES", "OFFICEMAXIM", "BLOB", "LOL", "BREAK", "OLIVE", "SILICONVALIUM", "STONED", "EARN", "ERA", "IMO", "KONG", "RINSES", "BRUTEFOURSOME", "ACTED", "SEOUL", "YSL", "OURS", "HEADOFHAREM", "MOCKS", "TIP", "LOU", "EURASIA", "ACHEFOR", "BUMMER", "DXCV", "THELIONSDENIM", "PEERED", "BEANED", "NOAH", "TARA", "UTE", "EATIN", "PARTICLEBOREDOM", "SPEND", "IRA", "PIEALAMODEM", "TODOS", "GEL", "GOLEM", "NYSE"],
      "down": ["PSHAW", "HEYJOE", "DEPART", "SIN", "SITON", "ACID", "RACE", "ART", "NOR", "POSIT", "BUONO", "JIM", "AGATES", "BOGART", "ELAYNE", "ADIEUS", "MANDMS", "FORELEG", "MAVEN", "NEMO", "STOWE", "SAG", "SEAS", "TRY", "SHOCK", "SALON", "TWELVE", "TALONS", "VIA", "CBS", "ALI", "POLENTA", "OBI", "FRUIT", "FEMME", "MOTOR", "ALONSO", "XINGOUT", "IVE", "MED", "BIASED", "CREDO", "ARBOR", "LARUE", "SKULKS", "OFYORE", "RAH", "ICE", "ULM", "OSCAR", "MRI", "ESP", "SHORN", "EAU", "FLOOD", "MUMM", "SIDEARM", "EMI", "AXE", "ATBEST", "CHEAPO", "HEATED", "ELNINO", "FIENDS", "BEAT", "UNHIP", "CRUDDY", "VETOES", "SNARE", "DORAL", "PROAM", "DEMME", "TEAL", "ABLE", "PIG", "CIG", "LEO", "EON"]
    },
    "author": "Patrick Berry",
    "autowrap": null,
    "bbars": null,
    "circles": null,
    "clues": {
      "across": ["1. Many college profs", "5. Food preserver", "10. Sandwich choice, for short", "13. Crosswise to the keel", "18. Pool ball's \"Watch this!\" comment?", "21. Arles affirmative", "22. Onetime first name in Israeli politics", "23. High-mounted window you can't stop looking at?", "25. \"Come ___?\"", "26. Steely Dan album featuring \"Deacon Blues\"", "27. Traveled by bus", "28. Thin blue line?", "29. Resisted a job offer, say", "30. Go downhill", "32. Part of a watch touching the breastbone?", "35. End of many a list", "36. Camper's canful", "38. She's entertaining", "39. Heist planner's concern", "41. Wedding part", "42. Ceiling", "45. Strong winds", "46. \"You don't have to be busy to look busy,\" e.g.?", "54. Squished bug, e.g.", "56. [I'm so funny!]", "57. Go all to pieces", "58. Antipasto tidbit", "59. Pill that relieves computer-related anxiety?", "63. High", "64. Bring in", "65. History topic", "66. \"I think,\" to texters", "68. Empire State Building climber, for short", "69. Holds under the tap", "71. Inhuman group of golfers?", "76. Behaved", "77. 1988 Summer Olympics site", "79. Handbag monogram", "80. \"A Love Like ___\" (Barbra Streisand album)", "81. Sultan's wife, perhaps?", "83. Sends up", "85. Thank you for waiting", "86. Reed of rock", "87. \"1984\" superstate", "89. Desperately want", "94. Bad experience", "96. Late sixth-century year", "99. Jungle king's jeans and overalls?", "102. Looked intently", "104. Knocked on the noggin", "105. Rainy day planner?", "106. Twelve Oaks neighbor", "108. Pac-12 athlete", "109. Restaurant greeter's option", "110. Ennui among quantum physicists?", "114. Go on a shopping spree", "115. Savings plan, briefly", "116. Dessert delivered over the Internet?", "117. Brouhahas", "118. Cowlick fixer", "119. Monster of Jewish folklore", "120. The Big Board, for short"],
      "down": ["1. \"What a load of hogwash!\"", "2. Jimi Hendrix's debut single", "3. Set out", "4. Stray from righteousness", "5. Refuse to release", "6. Low-pH compound", "7. Go to the tape?", "8. \"___ hath an enemy called Ignorance\": Ben Jonson", "9. Negative conjunction", "10. Conjecture", "11. It's good in Italy", "12. Pal of Huck Finn", "13. Swirly marbles", "14. \"The Big Sleep\" co-star, 1946", "15. Funny Boosler", "16. They're exchanged in France", "17. Candy eaten in handfuls", "19. \"Praying\" part of a praying mantis", "20. Master", "24. Pixar title character", "29. Best-selling author who wrote \"I did not write it. God wrote it. I merely did his dictation\"", "31. Downswing", "32. They're heavy during storms", "33. Sample", "34. Injury symptom", "36. Reception room in a mansion", "37. Rare craps roll", "40. Sharp nails", "41. Through", "42. \"The Big Bang Theory\" network", "43. Sports Illustrated's Sportsman of the Century", "44. Creamy Italian side dish", "46. One taking a bow in Japan", "47. Smoothie ingredient", "48. Homme's partner", "49. Travel by car", "50. ___ Quijano (Don Quixote's real name)", "51. Deleting", "52. \"___ got a feeling ...\"", "53. What's in an Rx", "55. Leaning", "60. Words to live by", "61. Garden spot", "62. Lash of old westerns", "63. Hides in the shadows", "67. In olden times", "69. When doubled, ardent", "70. Diamonds, to a yegg", "72. Einstein's birthplace", "73. NATO alphabet vowel", "74. Hosp. diagnostic aid", "75. Ability to identify Zener cards", "77. Lacking a coat, maybe", "78. ___ de vie", "82. Fill, and then some", "83. Big name in Champagne", "84. Easily drawn gun", "87. One of the music industry's Big Four", "88. Kick out", "89. If everything goes your way", "90. Cut-rate", "91. Fierce, as an argument", "92. Weather Channel newsmaker", "93. Wicked ones", "94. About ready to drop", "95. Square", "97. Badly made", "98. Says no to", "100. Catch", "101. R. J. Reynolds brand", "102. Like three of golf's four majors", "103. \"Philadelphia\" director", "106. Greenish blue", "107. Having the knack", "110. Chinese zodiac animal", "111. Smoke", "112. Sort who's a natural leader, supposedly", "113. Great time"]
    },
    "code": null,
    "copyright": "2012, The New York Times",
    "date": "1\/1\/2012",
    "dow": "Sunday",
    "downmap": null,
    "editor": "Will Shortz",
    "grid": ["P", "H", "D", "S", ".", "S", "A", "R", "A", "N", ".", ".", "P", "B", "J", ".", "A", "B", "E", "A", "M", "S", "E", "E", "I", "F", "I", "C", "A", "R", "O", "M", ".", "O", "U", "I", ".", "G", "O", "L", "D", "A", "H", "Y", "P", "N", "O", "T", "I", "C", "T", "R", "A", "N", "S", "O", "M", ".", "A", "G", "A", "I", "N", "A", "J", "A", ".", "R", "O", "D", "E", ".", ".", "V", "E", "I", "N", ".", "S", "T", "A", "Y", "E", "D", "W", "O", "R", "S", "E", "N", ".", ".", "S", "T", "E", "M", "T", "O", "S", "T", "E", "R", "N", "U", "M", ".", "E", "T", "A", "L", ".", "S", "T", "E", "R", "N", "O", ".", ".", "H", "O", "S", "T", "E", "S", "S", ".", ".", ".", "G", "E", "T", "A", "W", "A", "Y", ".", ".", ".", "V", "O", "W", ".", ".", ".", ".", ".", "C", "A", "P", ".", "G", "A", "L", "E", "S", ".", "O", "F", "F", "I", "C", "E", "M", "A", "X", "I", "M", "B", "L", "O", "B", ".", "L", "O", "L", ".", ".", "B", "R", "E", "A", "K", ".", "O", "L", "I", "V", "E", "S", "I", "L", "I", "C", "O", "N", "V", "A", "L", "I", "U", "M", ".", ".", "S", "T", "O", "N", "E", "D", ".", ".", "E", "A", "R", "N", ".", "E", "R", "A", ".", "I", "M", "O", ".", "K", "O", "N", "G", ".", ".", "R", "I", "N", "S", "E", "S", ".", ".", "B", "R", "U", "T", "E", "F", "O", "U", "R", "S", "O", "M", "E", "A", "C", "T", "E", "D", ".", "S", "E", "O", "U", "L", ".", ".", "Y", "S", "L", ".", "O", "U", "R", "S", "H", "E", "A", "D", "O", "F", "H", "A", "R", "E", "M", ".", "M", "O", "C", "K", "S", ".", "T", "I", "P", ".", ".", ".", ".", ".", "L", "O", "U", ".", ".", ".", "E", "U", "R", "A", "S", "I", "A", ".", ".", ".", "A", "C", "H", "E", "F", "O", "R", ".", ".", "B", "U", "M", "M", "E", "R", ".", "D", "X", "C", "V", ".", "T", "H", "E", "L", "I", "O", "N", "S", "D", "E", "N", "I", "M", ".", ".", "P", "E", "E", "R", "E", "D", "B", "E", "A", "N", "E", "D", ".", "N", "O", "A", "H", ".", ".", "T", "A", "R", "A", ".", "U", "T", "E", "E", "A", "T", "I", "N", ".", "P", "A", "R", "T", "I", "C", "L", "E", "B", "O", "R", "E", "D", "O", "M", "S", "P", "E", "N", "D", ".", "I", "R", "A", ".", "P", "I", "E", "A", "L", "A", "M", "O", "D", "E", "M", "T", "O", "D", "O", "S", ".", "G", "E", "L", ".", ".", "G", "O", "L", "E", "M", ".", "N", "Y", "S", "E"],
    "gridnums": [1, 2, 3, 4, 0, 5, 6, 7, 8, 9, 0, 0, 10, 11, 12, 0, 13, 14, 15, 16, 17, 18, 0, 0, 0, 19, 0, 0, 0, 0, 0, 20, 0, 21, 0, 0, 0, 22, 0, 0, 0, 0, 23, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 0, 0, 0, 0, 25, 0, 0, 0, 0, 26, 0, 0, 0, 27, 0, 0, 0, 0, 0, 28, 0, 0, 0, 0, 29, 0, 0, 0, 0, 0, 30, 0, 0, 31, 0, 0, 0, 0, 32, 33, 0, 0, 0, 0, 34, 0, 0, 0, 0, 0, 0, 0, 35, 0, 0, 0, 0, 36, 37, 0, 0, 0, 0, 0, 0, 38, 0, 0, 0, 0, 0, 0, 0, 0, 0, 39, 0, 40, 0, 0, 0, 0, 0, 0, 0, 41, 0, 0, 0, 0, 0, 0, 0, 42, 43, 44, 0, 45, 0, 0, 0, 0, 0, 46, 47, 48, 0, 0, 0, 49, 50, 51, 52, 53, 54, 0, 0, 55, 0, 56, 0, 0, 0, 0, 57, 0, 0, 0, 0, 0, 58, 0, 0, 0, 0, 59, 0, 0, 0, 60, 0, 0, 0, 61, 62, 0, 0, 0, 0, 0, 63, 0, 0, 0, 0, 0, 0, 0, 64, 0, 0, 0, 0, 65, 0, 0, 0, 66, 0, 67, 0, 68, 0, 0, 0, 0, 0, 69, 70, 0, 0, 0, 0, 0, 0, 71, 0, 72, 0, 0, 0, 73, 0, 0, 0, 0, 74, 75, 76, 0, 0, 0, 0, 0, 77, 78, 0, 0, 0, 0, 0, 79, 0, 0, 0, 80, 0, 0, 0, 81, 0, 0, 0, 0, 82, 0, 0, 0, 0, 0, 0, 83, 0, 0, 0, 84, 0, 85, 0, 0, 0, 0, 0, 0, 0, 86, 0, 0, 0, 0, 0, 87, 0, 0, 0, 0, 0, 88, 0, 0, 0, 89, 90, 91, 92, 93, 0, 0, 0, 0, 94, 95, 0, 0, 0, 0, 0, 96, 0, 97, 98, 0, 99, 0, 0, 0, 0, 0, 0, 100, 101, 0, 0, 0, 0, 0, 0, 102, 0, 0, 0, 0, 103, 104, 0, 0, 0, 0, 0, 0, 105, 0, 0, 0, 0, 0, 106, 107, 0, 0, 0, 108, 0, 0, 109, 0, 0, 0, 0, 0, 110, 0, 0, 0, 0, 111, 112, 0, 0, 0, 0, 113, 0, 0, 0, 114, 0, 0, 0, 0, 0, 115, 0, 0, 0, 116, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 117, 0, 0, 0, 0, 0, 118, 0, 0, 0, 0, 119, 0, 0, 0, 0, 0, 120, 0, 0, 0],
    "hold": null,
    "id": null,
    "id2": null,
    "interpretcolors": null,
    "jnotes": null,
    "key": null,
    "mini": null,
    "notepad": null,
    "publisher": "The New York Times",
    "rbars": null,
    "shadecircles": null,
    "size": { "cols": 21, "rows": 21 },
    "title": "ADDENDUM",
    "track": null,
    "type": null
  },
  fifteenByFifteen:
    {
      "acrossmap": null,
      "admin": false,
      "answers": {
        "across": ["AHEM", "NANA", "CLOVE", "DIVA", "OWES", "LAVAS", "AMEN", "MANICURIST", "MANDRAKE", "ABIDE", "AIDE", "RIMA", "SPARES", "MANATEES", "EOSIN", "DOZEN", "LAT", "ASSN", "SORES", "DOGE", "TIE", "ETWAS", "REPEL", "OTTOMANS", "CAMERA", "LUMS", "SARA", "LADLE", "FUMANCHU", "MANHANDLED", "DOUR", "GROAT", "DADE", "ELLA", "TANTE", "STEN", "DEAL"],
        "down": ["ADAM", "HIMA", "EVEN", "MANDARIN", "NOMADS", "AWAKE", "NENE", "ASI", "CLUBMAN", "LARIAT", "OVID", "VASE", "EST", "CAINES", "RIEN", "RAZES", "SEATO", "POSIT", "ASSET", "MORAS", "ELOPE", "EAGER", "STELA", "DOWNS", "STAMEN", "DEMANDED", "EMULATE", "RARA", "OLDHAT", "CAMDEN", "SUEDE", "LARA", "ANON", "FLAT", "COLE", "HULA", "URAL", "MGT", "DDS"]
      },
      "author": "Alfio Micci",
      "autowrap": null,
      "bbars": null,
      "circles": null,
      "clues": {
        "across": ["1. Attention getter", "5. Zola title", "9. Garlic unit", "14. Met V.I.P.", "15. Is obligated", "16. Volcanic outputs", "17. Hymn word", "18. Nail specialist", "20. May apple", "22. Tolerate", "23. Staff man", "24. Terza ___", "25. Bowling scores", "28. Aquatic mammals", "32. Red dye", "33. Baker's ___", "34. Geographical abbr.", "35. Org.", "36. Tender spots", "37. Venetian ruler", "38. Draw", "39. Something, in Germany", "40. Turn back", "41. Footstools", "43. \"I am a ___\"", "44. Chimneys, in Glasgow", "45. Teasdale", "46. Soup server", "48. Fictional villain", "52. Pawed", "54. Sullen", "55. Old English coin", "56. Florida county", "57. Fitzgerald", "58. French relative", "59. Machine gun", "60. Start a card game"],
        "down": ["1. Bede", "2. Uganda people", "3. Smooth", "4. Orange", "5. Restless ones", "6. On one's toes", "7. Hawaiian goose", "8. \"___ was saying . . . \"", "9. Elk or Rotarian", "10. Lasso", "11. Roman poet", "12. Flower holder", "13. Superlative ending", "19. Actor Michael and family", "21. Nothing, in Paris", "24. Destroys", "25. Treaty org.", "26. Assume", "27. Black-ink item", "28. S.A. trees", "29. Run off", "30. Agog", "31. Stone slab", "33. Football units", "36. Flower part", "37. Called for", "39. Rival", "40. ___ avis", "42. Passé", "43. N.J. city", "45. Shoe material", "46. Pasternak heroine", "47. Soon", "48. Stale", "49. Porter", "50. Oahu dance", "51. Russian range", "52. Labor's counterpart: Abbr.", "53. Dental degree"]
      },
      "code": null,
      "copyright": "1976, The New York Times",
      "date": "1\/1\/1976",
      "dow": "Thursday",
      "downmap": null,
      "editor": "Will Weng",
      "grid": ["A", "H", "E", "M", ".", "N", "A", "N", "A", ".", "C", "L", "O", "V", "E", "D", "I", "V", "A", ".", "O", "W", "E", "S", ".", "L", "A", "V", "A", "S", "A", "M", "E", "N", ".", "M", "A", "N", "I", "C", "U", "R", "I", "S", "T", "M", "A", "N", "D", "R", "A", "K", "E", ".", "A", "B", "I", "D", "E", ".", ".", ".", ".", "A", "I", "D", "E", ".", "R", "I", "M", "A", ".", ".", ".", "S", "P", "A", "R", "E", "S", ".", "M", "A", "N", "A", "T", "E", "E", "S", "E", "O", "S", "I", "N", ".", "D", "O", "Z", "E", "N", ".", "L", "A", "T", "A", "S", "S", "N", ".", "S", "O", "R", "E", "S", ".", "D", "O", "G", "E", "T", "I", "E", ".", "E", "T", "W", "A", "S", ".", "R", "E", "P", "E", "L", "O", "T", "T", "O", "M", "A", "N", "S", ".", "C", "A", "M", "E", "R", "A", ".", ".", ".", "L", "U", "M", "S", ".", "S", "A", "R", "A", ".", ".", ".", ".", "L", "A", "D", "L", "E", ".", "F", "U", "M", "A", "N", "C", "H", "U", "M", "A", "N", "H", "A", "N", "D", "L", "E", "D", ".", "D", "O", "U", "R", "G", "R", "O", "A", "T", ".", "D", "A", "D", "E", ".", "E", "L", "L", "A", "T", "A", "N", "T", "E", ".", "S", "T", "E", "N", ".", "D", "E", "A", "L"],
      "gridnums": [1, 2, 3, 4, 0, 5, 6, 7, 8, 0, 9, 10, 11, 12, 13, 14, 0, 0, 0, 0, 15, 0, 0, 0, 0, 16, 0, 0, 0, 0, 17, 0, 0, 0, 0, 18, 0, 0, 0, 19, 0, 0, 0, 0, 0, 20, 0, 0, 0, 21, 0, 0, 0, 0, 22, 0, 0, 0, 0, 0, 0, 0, 0, 23, 0, 0, 0, 0, 24, 0, 0, 0, 0, 0, 0, 25, 26, 27, 0, 0, 0, 0, 28, 0, 0, 0, 0, 29, 30, 31, 32, 0, 0, 0, 0, 0, 33, 0, 0, 0, 0, 0, 34, 0, 0, 35, 0, 0, 0, 0, 36, 0, 0, 0, 0, 0, 37, 0, 0, 0, 38, 0, 0, 0, 39, 0, 0, 0, 0, 0, 40, 0, 0, 0, 0, 41, 0, 0, 42, 0, 0, 0, 0, 0, 43, 0, 0, 0, 0, 0, 0, 0, 0, 44, 0, 0, 0, 0, 45, 0, 0, 0, 0, 0, 0, 0, 46, 47, 0, 0, 0, 0, 48, 0, 0, 0, 0, 49, 50, 51, 52, 0, 0, 0, 0, 0, 53, 0, 0, 0, 0, 54, 0, 0, 0, 55, 0, 0, 0, 0, 0, 56, 0, 0, 0, 0, 57, 0, 0, 0, 58, 0, 0, 0, 0, 0, 59, 0, 0, 0, 0, 60, 0, 0, 0],
      "hold": null,
      "id": null,
      "id2": null,
      "interpretcolors": null,
      "jnotes": null,
      "key": null,
      "mini": null,
      "notepad": null,
      "publisher": "The New York Times",
      "rbars": null,
      "shadecircles": null,
      "size": { "cols": 15, "rows": 15 },
      "title": "NY TIMES, THU, JAN 01, 1976",
      "track": null,
      "type": null
    },
  helloWorld: {
      "acrossmap": null,
      "admin": false,
      "answers": {
        "across": ["HELLO"],
        "down": ["WORLD"]
      },
      "author": "Jessica Sachs",
      "autowrap": null,
      "bbars": null,
      "circles": null,
      "clues": {
        "across": ["2. Universe"],
        "down": ["1. Hey"]
      },
      "code": null,
      "copyright": "2020, The Programmer Times",
      "date": "9\/1\/2020",
      "dow": "Thursday",
      "downmap": null,
      "editor": "My Friend Kate",
      "grid": [
        ".", "H", ".", ".", ".",
        ".", "E", ".", ".", ".",
        ".", "L", ".", ".", ".",
        ".", "L", ".", ".", ".",
        "W", "O", "R", "L", "D"],
      "gridnums": [
        0, 1, 0, 0, 0,
        0, 0, 0, 0, 0,
        0, 0, 0, 0, 0,
        0, 0, 0, 0, 0,
        2, 0, 0, 0, 0],
      "hold": null,
      "id": null,
      "id2": null,
      "interpretcolors": null,
      "jnotes": null,
      "key": null,
      "mini": null,
      "notepad": null,
      "publisher": "The Programmer Times",
      "rbars": null,
      "shadecircles": null,
      "size": { "cols": 5, "rows": 5 },
      "title": "PHRASES PROGRAMMERS USE",
      "track": null,
      "type": null
    },
  oneByTwo: {
    size: { cols: 1, rows: 2 },
    gridnums: [1, 0],
    grid: ['A', 'N'],
    answers: {
      across: ['AN'],
      down: [],
    },
    clues: {
      across: ['1. ___ article of speech'],
      down: []
    }
  }
}, createCrossword)
