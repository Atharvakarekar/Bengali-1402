/* ============================================================
   EVERYTHING YOU NEED TO EDIT LIVES IN THIS FILE.
   Change the words, drop your files into the /media folder,
   and make sure the file names below match exactly.
   ============================================================ */
window.SHOW = {
  name: "Birthday Girl",          // <- her name (or the nickname only you use)
  from: "Atharva",
  date: "16 November",
  jersey: "16",                   // number on her player card

  // Optional background song. Put the file in /media and write e.g. "media/song.mp3".
  // Leave "" for no music.
  song: "",

  // ACT I — her dance videos (portrait reels look best). Keep each under ~25 MB.
  videos: [
    { src: "media/dance1.mp4", poster: "media/dance1.jpg", title: "The whole studio is yours and you know it" },
    { src: "media/dance2.mp4", poster: "media/dance2.jpg", title: "Thirteen seconds of pure attitude" }
  ],

  // ACT II — player card. value is 0-100, show is what's printed.
  stats: [
    { label: "Energy",               value: 99,  show: "99" },
    { label: "Comic timing",         value: 96,  show: "96" },
    { label: "Dance",                value: 100, show: "∞" },
    { label: "Sitting still",        value: 9,   show: "09" },
    { label: "Admitting she cares",  value: 4,   show: "04", note: "under review — see Act III" }
  ],
  scouting: "Arrives loud, leaves louder. Will turn any open floor into a stage and any bad day into a bit. Do not be fooled by the 'whatever' face. Extremely rare player. Not for trade.",

  // ACT III — DRAFTS. Replace these with REAL moments only the two of you know.
  // says = how she plays it.  does = what she actually did.
  quiet: [
    { says: "“It's not a big deal.”",        does: "And then you showed up anyway. You always do." },
    { says: "“I'm fine, don't be dramatic.”", does: "Said by the person who remembers every small thing I mention once." },
    { says: "“Whatever, do what you want.”",  does: "Followed by checking, twice, that I actually got it done." },
    { says: "“I'm not the emotional type.”",  does: "Sure. I've seen what you do for people when you think nobody's counting." }
  ],

  // ACT IV — photos. Delete lines you don't need, add more if you have them.
  memories: [
    { src: "media/photo1.jpg", caption: "Main character. No notes.", when: "" },
    { src: "media/photo2.jpg", caption: "Whatever I said, it worked", when: "" },
    { src: "media/photo3.jpg", caption: "You, mid-lecture. Me, pretending to listen.", when: "" },
    { src: "media/photo4.jpg", caption: "The bike has never looked this good", when: "" },
    { src: "media/photo5.jpg", caption: "The calls that were supposed to be five minutes", when: "" },
    { src: "media/photo6.jpg", caption: "This face, two seconds before chaos", when: "" },
    { src: "media/photo7.jpg", caption: "Dressed and ready before the music even started", when: "" }
  ],

  // FINALE — the letter. One string per paragraph. Make it sound like you.
  letter: [
    "Most people walk into a room. You sort of bounce into it, and the room is better for it.",
    "I've watched you dance enough times to know that's when you are most yourself. Everything else goes quiet and you just breathe.",
    "You'd never say this out loud, so I will: you care more than almost anyone I know. You do it quietly and then act like it was nothing. It was never nothing to me.",
    "I don't need a name for what we are. I'm just glad you're close. I hope this year hands you bigger stages, more wins, and many more reasons to laugh that loudly.",
    "Happy birthday. Now take your bow."
  ]
};
