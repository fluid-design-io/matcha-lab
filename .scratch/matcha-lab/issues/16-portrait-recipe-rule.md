# The portrait recipe's column rule

Type: task
Status: open
Blocked by: —

Split out of [Viewport verification pass](./13-viewport-pass.md) as a taste call rather than a
defect. Nothing here overflows, scrolls or misses a measurement.

## Question

In the tall arrangement, `手順 METHOD` and `味 TASTING NOTE` sit side by side with a 1px
`--color-hairline` rule between them, and that rule is a grid item in a `minmax(0,1fr)` row — so it
runs the full height of the band while the type beside it stops after four method steps and five
axis rows.

Measured with the panel open on 凪 NAGI, ink bottom against rule bottom:

| Viewport | Panel | Rule length | Rule with nothing beside it | |
| --- | --- | ---: | ---: | ---: |
| 768×1024 | 652×908 | 295 px | 67 px | 23% |
| 834×1194 | 718×1078 | 439 px | 202 px | 46% |
| 1024×1366 | 884×1226 | 556 px | 316 px | **57%** |

It gets worse as the panel grows, because the content is a fixed number of lines and the row is
`1fr`. At the portrait master a single hairline runs 316 px down an otherwise empty sheet of paper.

Landscape has the same slack — 124 px below the lowest ink in a 619 px body grid at 1366×1024, 20%
— but there the wrapper turns to `grid-rows-[auto_1px_minmax(0,1fr)]` and the rule is horizontal,
so nothing draws the void. `ref-3-recipe.png` is landscape, so the reference does not settle this;
there is no portrait recipe mockup.

The question is one line of taste: **does a column rule that outruns its columns read as a
printer's rule, or as an empty table cell?** Two defensible answers.

- *It is a rule.* Newspaper column rules run the full measure whether or not the last column is
  short, and `DESIGN-TASTE.md` asks for calm and spacious. Change nothing.
- *It is a cell.* The app has exactly two hairline roles and neither is decorative; a rule that
  keeps going after its content stops is describing a grid rather than separating two things.

If the second, the smallest honest change is in `recipe.panel.tsx`: the tall-and-roomy body grid is
`grid-rows-[auto_minmax(0,1fr)]`, and making the second row `auto` shrinks the band to its content
so the rule ends where the type does, moving the slack below the band where no ink marks it. That
also shortens the render/build row's neighbour, so check all nine drinks and both portrait targets
after — the fit currently has 316 px of headroom and would keep it.

**Do not** reach for `align-self` on the rule itself: it is 1px wide, and a `start`-aligned grid
item with no intrinsic height collapses to nothing.
