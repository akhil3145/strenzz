# Strenzz 🏋️

A simple strength tracker I built for myself because every app out there is either too bloated or wants a monthly subscription for basic stuff.

No accounts. No cloud sync. No ads. Just open the file and track your lifts.

---

## What it does

- **Log your lifts** — exercise, weight, sets, reps, notes
- **Progress graphs** — see your strength trend weekly, monthly or all time
- **Strength rank** — tells you how your lifts compare to the general lifting population (e.g. top 12% in bench press for your bodyweight)
- **Calculators** — 1 rep max estimator, BMI, and body fat % using the Navy method

---

## How to use

Download or clone the repo, open `index.html` in any browser. That's genuinely it.

```bash
git clone https://github.com/YOUR_USERNAME/strenzz.git
cd strenzz
# open index.html in your browser
```

No npm. No installs. No build step.

---

## Stack

- Vanilla HTML / CSS / JS
- [Chart.js](https://www.chartjs.org/) for graphs (loaded via CDN)
- Google Fonts (Bebas Neue + DM Sans)
- localStorage for data persistence

Keeping it simple on purpose. I didn't want a framework for something this small.

---

## Data & privacy

Everything stays in your browser's localStorage. Nothing gets sent anywhere. If you clear your browser data, your logs go with it — so export if you care about keeping them long term (export feature coming).

---

## Strength standards

The percentile rankings in the "My Rank" section are based on general population lifting data compiled from sources like Symmetric Strength. They're not perfect but give a reasonable ballpark for untrained → advanced lifters.

---

## Planned / maybe someday

- [ ] Export logs as CSV
- [ ] Bodyweight tracking over time
- [ ] Custom exercise names
- [ ] Dark/light theme toggle
- [ ] PWA support (installable on phone)

---

## Why "Strenzz"

Strength. With z's. Looked cooler.

---

Made this for personal use, sharing it in case it's useful to anyone else. Feel free to fork it and make it your own.
