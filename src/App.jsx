import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ─── TIER CONFIG ──────────────────────────────────────────────
const TC = {
  S: { color: "#ff9d00", bg: "rgba(255,157,0,0.08)", border: "rgba(255,157,0,0.25)" },
  A: { color: "#4ade80", bg: "rgba(74,222,128,0.06)", border: "rgba(74,222,128,0.2)" },
  B: { color: "#60a5fa", bg: "rgba(96,165,250,0.06)", border: "rgba(96,165,250,0.18)" },
  C: { color: "#f87171", bg: "rgba(248,113,113,0.05)", border: "rgba(248,113,113,0.15)" },
};
const TIERS = ["S","A","B","C"];

// ─── COMPLETE KNOWLEDGE BASE (sourced from mewgenics.wiki) ────
// type: A=Active, P=Passive | mp: mana cost (null=free/passive)
// tier: S=run-winning, A=strong, B=situational, C=trap/weak
// desc: what it does | upg: upgrade+ effect
const KB = {
  Hunter: {
    icon:"🏹", role:"Ranged DPS · Crits & Distance",
    combos:["Marked + Arrow Flurry (Exodia - never miss all 5)","Bullseye + Heavy Shot (guaranteed 12dmg 4mp)","Rubber Arrows + Scatter Shot (bounce chaos)","Persistent Hunt + any inaccurate shot"],
    abilities:[
      // ── ACTIVES (54 total from wiki) ──
      {name:"Arrow Flurry",      type:"A",mp:8,   tier:"S",desc:"Shoot 5 weak shots, each with 50% miss chance. Guaranteed hits with Bullseye/Marked.",upg:"More shots or reduced miss chance."},
      {name:"Marked",            type:"A",mp:5,   tier:"S",desc:"Inflict Marked on a unit. Next physical attack cannot miss and crits.",              upg:"Upgrade+: marks entire enemy types — team-wide effect."},
      {name:"Heavy Shot",        type:"A",mp:4,   tier:"S",desc:"High-damage shot, 70% miss. Guaranteed 12 dmg for 4mp with Marked/Bullseye.",       upg:"Assumed: miss reduced or flat dmg increased."},
      {name:"Snipe",             type:"A",mp:6,   tier:"A",desc:"Fire a shot exactly 6 tiles away that ignores Shield and cannot miss.",              upg:"Assumed: range +1 or added Bleed."},
      {name:"Persistent Hunt",   type:"A",mp:0,   tier:"A",desc:"Inflict Marked 5 on a unit. RELOAD: Kill an enemy.",                               upg:"Upgrade+: Marked spreads to nearby units on reload."},
      {name:"Scatter Shot",      type:"A",mp:7,   tier:"A",desc:"Fire a bunch of shots randomly in an area.",                                        upg:"More projectiles or wider area."},
      {name:"Sentry Mode",       type:"A",mp:6,   tier:"A",desc:"Next time an enemy ends movement in your range, auto-shoot them.",                  upg:"Triggers twice or adds Stun."},
      {name:"Line Shot",         type:"A",mp:7,   tier:"A",desc:"An attack that hits all units in a straight line.",                                  upg:"Added status effect on Upgrade+."},
      {name:"Hail of Nails",     type:"A",mp:9,   tier:"A",desc:"Shoot many nails in a wide area.",                                                  upg:"More nails or added Bleed."},
      {name:"Bomb Shot",         type:"A",mp:7,   tier:"A",desc:"Lobbed explosive shot that deals AoE damage on impact.",                            upg:"Larger blast radius."},
      {name:"Cross Shot",        type:"A",mp:7,   tier:"A",desc:"Fire in a cross pattern hitting 4 directions simultaneously.",                       upg:"Wider cross or added element."},
      {name:"Focus Shot",        type:"A",mp:7,   tier:"A",desc:"High-damage accurate ranged shot.",                                                  upg:"Adds Stun or ignores armor."},
      {name:"Fire Shot",         type:"A",mp:7,   tier:"A",desc:"Burning ranged shot that applies Burn on hit.",                                      upg:"Higher Burn stacks."},
      {name:"Twin Shot",         type:"A",mp:9,   tier:"A",desc:"Fire two shots simultaneously at a target.",                                         upg:"Three shots at Upgrade+."},
      {name:"Arrowsmith",        type:"A",mp:5,   tier:"A",desc:"Gain +1 Bonus Attack at start of your next turn.",                                  upg:"2 Bonus Attacks at Upgrade+."},
      {name:"Scout Me",          type:"A",mp:7,   tier:"A",desc:"Until next turn, allied cats gain a bonus ability to shoot a tile of their choice.", upg:"Castable once per turn becomes twice."},
      {name:"Stake Out",         type:"A",mp:3,   tier:"A",desc:"Set a position to gain bonus damage from next attack.",                              upg:"Higher dmg bonus or added effect."},
      {name:"Vivisect",          type:"A",mp:4,   tier:"A",desc:"Attack a unit, causing it to take increased damage from all sources.",               upg:"Assumed: longer debuff duration."},
      {name:"Bounce Shot",       type:"A",mp:3,   tier:"B",desc:"Projectile that bounces to another nearby enemy.",                                   upg:"Extra bounce at Upgrade+."},
      {name:"Chaos Shot",        type:"A",mp:3,   tier:"B",desc:"Cheap shot with a random effect.",                                                   upg:"Better RNG pool."},
      {name:"Needle Shot",       type:"A",mp:2,   tier:"B",desc:"Cheap weak ranged shot.",                                                            upg:"Added Bleed at Upgrade+."},
      {name:"Last Hit",          type:"A",mp:3,   tier:"B",desc:"Ranged attack that deals more damage to low-HP units.",                              upg:"Executes below a HP threshold."},
      {name:"Shards",            type:"A",mp:3,   tier:"B",desc:"Fire a spread of shards in front of you.",                                           upg:"More shards or wider spread."},
      {name:"Bear Trap",         type:"A",mp:5,   tier:"B",desc:"Place a trap that immobilizes enemies that trigger it.",                             upg:"Longer immobilize or added dmg."},
      {name:"Bait Trap",         type:"A",mp:5,   tier:"B",desc:"Place a trap that lures enemies toward it.",                                         upg:"Stronger lure range."},
      {name:"Spike Trap",        type:"A",mp:6,   tier:"B",desc:"Place a spike trap dealing damage to enemies that step on it.",                      upg:"Higher dmg or Bleed on trigger."},
      {name:"Web Trap",          type:"A",mp:4,   tier:"B",desc:"Place a web trap that immobilizes and Slows enemies.",                               upg:"Longer Slow or bigger web."},
      {name:"Charm Trap",        type:"A",mp:6,   tier:"B",desc:"Trap that Charms the enemy that triggers it.",                                       upg:"Longer Charm duration."},
      {name:"Egg Sac Trap",      type:"A",mp:5,   tier:"B",desc:"Trap that spawns spiders when triggered.",                                           upg:"More spiders spawned."},
      {name:"Flea Shot",         type:"A",mp:6,   tier:"B",desc:"Shoot a flea at a unit, spawning a flea familiar.",                                 upg:"More fleas or stronger flea."},
      {name:"Spawn Maggot Friend",type:"A",mp:3,  tier:"B",desc:"Spawn a maggot familiar to fight for you.",                                          upg:"Maggot starts buffed."},
      {name:"Spawn Pooter Friend",type:"A",mp:7,  tier:"B",desc:"Spawn a pooter familiar.",                                                           upg:"Pooter starts buffed."},
      {name:"Call of the Wild",   type:"A",mp:9,  tier:"B",desc:"Spawn a charmed Tom Tom familiar.",                                                  upg:"Tom Tom starts buffed."},
      {name:"Ball of Spiders",    type:"A",mp:9,  tier:"B",desc:"Lob a ball that spawns spiders on impact.",                                          upg:"More spiders."},
      {name:"Cupid's Arrow",      type:"A",mp:12, tier:"B",desc:"Charm a unit. Expensive but powerful CC.",                                           upg:"Reduced cost or AoE charm."},
      {name:"Bramble Shot",       type:"A",mp:7,  tier:"B",desc:"Shot that spawns Brambles on impact, blocking enemy movement.",                      upg:"Larger Bramble patch."},
      {name:"Summon Brambles",    type:"A",mp:4,  tier:"B",desc:"Summon Brambles in a target area to block movement.",                                upg:"Larger area or more Brambles."},
      {name:"Hedge In",          type:"A",mp:4,   tier:"B",desc:"Surround a unit with Brambles to trap it.",                                          upg:"More Brambles or longer trap."},
      {name:"Slop the Pigs",     type:"A",mp:6,   tier:"B",desc:"Create food items to lure enemies.",                                                 upg:"More food spawned."},
      {name:"Picnic",            type:"A",mp:7,   tier:"B",desc:"Create a food spread, healing allies that eat from it.",                             upg:"More food or higher heal."},
      {name:"Pheromones",        type:"A",mp:5,   tier:"B",desc:"Attract enemies to a specific location for one turn.",                               upg:"Longer lure duration."},
      {name:"Poison Lace",       type:"A",mp:5,   tier:"B",desc:"Inflict Poison on a unit.",                                                          upg:"Higher Poison stacks."},
      {name:"Infest",            type:"A",mp:4,   tier:"B",desc:"Infest a unit with parasites, dealing damage over time.",                            upg:"Faster damage tick."},
      {name:"Diversion",         type:"A",mp:4,   tier:"B",desc:"Distract enemies, forcing them to face toward you.",                                 upg:"Wider distraction range."},
      {name:"Collect Pelt",      type:"A",mp:4,   tier:"B",desc:"Collect resources from a defeated enemy.",                                           upg:"Better resource quality."},
      {name:"Craft Arrow",       type:"A",mp:2,   tier:"B",desc:"Collect an adjacent pickup and gain +1 Bonus Attack instead of its normal effect.",  upg:"2 Bonus Attacks at Upgrade+."},
      {name:"Extend",            type:"A",mp:3,   tier:"B",desc:"Increase range of your next ranged attack.",                                          upg:"Extra range gained."},
      {name:"Soothing Shot",     type:"A",mp:7,   tier:"B",desc:"Shoot a unit to apply a calming debuff.",                                            upg:"Longer duration or added effect."},
      {name:"Terrain Walk",      type:"A",mp:4,   tier:"C",desc:"Gain movement through difficult terrain for a turn.",                                 upg:"Unknown."},
      {name:"Trail Blazer",      type:"A",mp:3,   tier:"C",desc:"Leave a trail that grants movement bonuses to allies.",                               upg:"Unknown."},
      {name:"Tactical Retreat",  type:"A",mp:6,   tier:"C",desc:"Dash away from an adjacent threat.",                                                  upg:"Longer dash or bonus."},
      {name:"Harpoon",           type:"A",mp:5,   tier:"C",desc:"Pull a unit toward you. Anti-synergy for a class that wants distance.",              upg:"Increased pull range."},
      {name:"Shoot Here!",       type:"A",mp:0,   tier:"B",desc:"Mark a tile — allies can shoot at that tile this turn.",                              upg:"Allies get +1 range for the shot."},
      // ── PASSIVES (25 total) ──
      {name:"Bullseye",          type:"P",        tier:"S",desc:"Ranged attacks never miss. +25% crit chance.",                                        upg:"Upgrade+: gain +1 LCK each crit — snowball."},
      {name:"Rubber Arrows",     type:"P",        tier:"A",desc:"Projectiles bounce to another enemy within 3 tiles after hitting.",                   upg:"Longer bounce range."},
      {name:"Tower Defense",     type:"P",        tier:"A",desc:"When an enemy comes within range, shoot them for 1 damage.",                          upg:"Shoot for 2 or add a status effect."},
      {name:"Thrill of the Hunt",type:"P",        tier:"A",desc:"Kill 3+ enemies in a battle: gain +1 DEX permanently + a consumable item.",          upg:"Lower kill threshold or +2 DEX."},
      {name:"Thorn Arrows",      type:"P",        tier:"A",desc:"Your basic attacks add Thorns to the target on hit.",                                 upg:"Higher Thorns stacks."},
      {name:"Sniper",            type:"P",        tier:"B",desc:"Your basic attack range is extended.",                                                 upg:"Further range extension."},
      {name:"Brood Mother",      type:"P",        tier:"B",desc:"Your familiars and Charmed units gain +2 Damage and +5 HP.",                         upg:"Higher bonuses."},
      {name:"Split Shot",        type:"P",        tier:"B",desc:"Your basic attack hits +1 area but deals 50% less damage.",                           upg:"Reduced penalty at Upgrade+."},
      {name:"Animal Control",    type:"P",        tier:"B",desc:"Force a charmed unit to attack an enemy of your choice.",                             upg:"Unknown."},
      {name:"Catch Projectiles", type:"P",        tier:"B",desc:"Catch projectiles that pass through you, gaining Bonus Attacks.",                     upg:"Unknown."},
      {name:"Traps",             type:"P",        tier:"B",desc:"+1 DEX for each trap triggered this battle.",                                         upg:"Higher DEX gain per trigger."},
      {name:"Tricky Traps",      type:"P",        tier:"B",desc:"Your traps have enhanced effects when triggered.",                                    upg:"Unknown."},
      {name:"Hunter's Boon",     type:"P",        tier:"B",desc:"Bonus effect when hunting in tall grass or at range.",                                upg:"Unknown."},
      {name:"Quiver",            type:"P",        tier:"B",desc:"Gain Bonus Attacks at the start of battle.",                                          upg:"More Bonus Attacks."},
      {name:"Take Aim",          type:"P",        tier:"B",desc:"Standing still boosts your next attack's accuracy and damage.",                       upg:"Stronger bonus."},
      {name:"Sleep Darts",       type:"P",        tier:"B",desc:"Basic attacks can inflict Sleep on hit.",                                             upg:"Higher Sleep chance."},
      {name:"Spotters",          type:"P",        tier:"B",desc:"Your basic attack can target tiles adjacent to allies.",                              upg:"Unknown."},
      {name:"Fleabag",           type:"P",        tier:"C",desc:"Passive flea-related effect.",                                                        upg:"Unknown."},
      {name:"Gravity Falls",     type:"P",        tier:"C",desc:"Enemies you knock back take extra fall damage.",                                      upg:"Unknown."},
      {name:"Hazardous",         type:"P",        tier:"C",desc:"Enemies near you take periodic chip damage.",                                         upg:"Unknown."},
      {name:"Host",              type:"P",        tier:"C",desc:"You are host to parasites that interact with combat.",                                upg:"Unknown."},
      {name:"Luck Swing",        type:"P",        tier:"B",desc:"+50% crit chance but +25% chance to miss.",                                           upg:"Assumed: higher crit, lower miss penalty."},
      {name:"Tainted Mother",    type:"P",        tier:"C",desc:"Familiars you spawn have a tainted/dark bonus effect.",                               upg:"Unknown."},
      {name:"Survivalist",       type:"P",        tier:"B",desc:"Gain bonus effects from using consumable items in battle.",                            upg:"Unknown."},
      {name:"Talk to Animals",   type:"P",        tier:"B",desc:"Charmed animals gain additional bonuses.",                                            upg:"Unknown."},
    ],
  },

  Fighter: {
    icon:"⚔️", role:"Melee DPS · Brawler & Burst (S-tier class, ~90% win rate paired with Medic)",
    combos:["Zoomzerk + Merciless (Infinite Engine — chain dashes)","Gravity Slam + Spin (Blender — pull then delete packs)","Berserk + Falcon Punch (stat pump + nuke)","Stoopzerk + Dumb Muscle (0 INT = 100% crit)"],
    abilities:[
      // ── ACTIVES (56 total) ──
      {name:"Zoomzerk",         type:"A",mp:0,   tier:"S",desc:"Your movement action becomes a dash attack. This ability becomes Reposition.",       upg:"Upgrade+: restores max mana on use — broken for low-INT builds."},
      {name:"Spin",             type:"A",mp:6,   tier:"S",desc:"Hit all adjacent units for melee damage.",                                            upg:"Likely adds Knockback or bonus dmg."},
      {name:"Gravity Slam",     type:"A",mp:6,   tier:"S",desc:"Jump to a tile and pull all enemies toward you when you land.",                       upg:"Larger pull radius or adds Stun."},
      {name:"Berserk",          type:"A",mp:4,   tier:"A",desc:"Gain +5 STR and Bruise 5. This ability becomes Berserker Dash.",                     upg:"Longer buff or less Bruise at Upgrade+."},
      {name:"Leap",             type:"A",mp:6,   tier:"A",desc:"Jump to a tile and deal damage to anything you land on.",                             upg:"Upgrade+: immobilizes units in area around landing."},
      {name:"Falcon Punch",     type:"A",mp:2,   tier:"A",desc:"Powerful melee punch (cheap 2mp cost).",                                              upg:"Added Stun or AoE splash."},
      {name:"Cosmic Punch",     type:"A",mp:5,   tier:"A",desc:"Punch a unit into space — it disappears until end of the round.",                    upg:"Longer removal or damage on return."},
      {name:"Berserker Dash",   type:"A",mp:2,   tier:"A",desc:"Short-range dash attack (transforms from Berserk).",                                  upg:"Longer range or added Stun."},
      {name:"Meteor Slam",      type:"A",mp:10,  tier:"A",desc:"High-damage AoE melee slam.",                                                         upg:"Larger AoE or added Stun."},
      {name:"Confront",         type:"A",mp:7,   tier:"A",desc:"Guarantee you end up adjacent to your target.",                                       upg:"Bonus damage on arrival."},
      {name:"Enrage",           type:"A",mp:3,   tier:"A",desc:"Gain stat buffs based on missing HP.",                                                upg:"Stronger buff thresholds."},
      {name:"Synchro Spin",     type:"A",mp:8,   tier:"A",desc:"Spin attack that syncs with allied attacks — hits multiple enemies.",                  upg:"Wider area or ally buff."},
      {name:"Think Too Hard",   type:"A",mp:2,   tier:"A",desc:"Take damage equal to your INT. The next spell you cast this turn is free.",           upg:"Reduced self-damage."},
      {name:"One-Two Punch",    type:"A",mp:8,   tier:"A",desc:"A quick two-hit melee combo.",                                                        upg:"Third hit or added Stun."},
      {name:"Juiced",           type:"A",mp:4,   tier:"A",desc:"Gain temporary STR and speed for aggressive plays.",                                  upg:"Stronger or longer buff."},
      {name:"Side Slash",       type:"A",mp:7,   tier:"A",desc:"Melee attack that hits units in a wide side arc.",                                    upg:"Wider arc or added Bleed."},
      {name:"Uppercut",         type:"A",mp:7,   tier:"A",desc:"Melee strike that launches target upward.",                                           upg:"Higher knockback or dmg."},
      {name:"Grapple",          type:"A",mp:4,   tier:"B",desc:"Grab and hold an adjacent unit in place.",                                            upg:"Longer hold or added dmg."},
      {name:"Bull Rush",        type:"A",mp:6,   tier:"B",desc:"Dash forward, deal damage and knockback in a line.",                                  upg:"More knockback or added Stun."},
      {name:"Taunt!",           type:"A",mp:4,   tier:"B",desc:"Force nearby enemies to target you this turn.",                                       upg:"Longer taunt or wider range."},
      {name:"Stoopzerk",        type:"A",mp:6,   tier:"B",desc:"Immediately drop INT to 0. Enables the Low-INT archetype.",                           upg:"Unknown upgrade effect."},
      {name:"Counter",          type:"A",mp:6,   tier:"B",desc:"Prepare a counterattack — the next hit you take triggers a retaliation.",             upg:"Stronger counter or longer window."},
      {name:"Huddle",           type:"A",mp:6,   tier:"B",desc:"Grant adjacent allies a defensive buff.",                                             upg:"Higher buff value."},
      {name:"Hurl",             type:"A",mp:5,   tier:"B",desc:"Throw an adjacent unit at another target.",                                           upg:"Longer throw range."},
      {name:"Fury Swipes",      type:"A",mp:6,   tier:"B",desc:"Strike rapidly multiple times for smaller hits.",                                     upg:"More hits at Upgrade+."},
      {name:"Thunder Punch",    type:"A",mp:7,   tier:"B",desc:"Electric melee punch that may chain to adjacent units.",                               upg:"Longer chain or Stun."},
      {name:"Fire Punch",       type:"A",mp:7,   tier:"B",desc:"Melee punch that applies Burn on hit.",                                               upg:"Higher Burn stacks."},
      {name:"Ice Punch",        type:"A",mp:7,   tier:"B",desc:"Melee punch that applies Freeze on hit.",                                             upg:"Freeze 2 or AoE."},
      {name:"Lacerate",         type:"A",mp:4,   tier:"B",desc:"Melee attack that applies Bleed.",                                                    upg:"Higher Bleed stacks."},
      {name:"Rage Punch",       type:"A",mp:4,   tier:"B",desc:"Melee punch that deals more damage the angrier you are.",                             upg:"Stronger scaling."},
      {name:"Flex Off",         type:"A",mp:8,   tier:"B",desc:"Perform a team-wide STR-based buff.",                                                 upg:"Larger buff or longer duration."},
      {name:"Exert",            type:"A",mp:8,   tier:"B",desc:"Massive self-buff at the cost of exhaustion.",                                        upg:"Less cost or more buff."},
      {name:"Chaos Rampage",    type:"A",mp:3,   tier:"B",desc:"Low-cost rampage with random effects each hit.",                                      upg:"Unknown."},
      {name:"Assert Dominance", type:"A",mp:4,   tier:"B",desc:"Intimidate nearby enemies, reducing their stats.",                                    upg:"Stronger debuff."},
      {name:"1D Chess",         type:"A",mp:3,   tier:"B",desc:"Push a unit back one tile.",                                                          upg:"Unknown."},
      {name:"Reposition",       type:"A",mp:4,   tier:"B",desc:"Move up to two tiles (from Zoomzerk). Not the main use.",                             upg:"Unknown."},
      {name:"Sleeper Hold",     type:"A",mp:5,   tier:"B",desc:"Put an adjacent unit to Sleep.",                                                      upg:"Longer Sleep duration."},
      {name:"Ram",              type:"A",mp:6,   tier:"B",desc:"Dash into a unit and push them back.",                                                upg:"More knockback."},
      {name:"Tumble",           type:"A",mp:2,   tier:"B",desc:"Quick dodge roll for repositioning.",                                                 upg:"Longer roll or bonus."},
      {name:"Inhale",           type:"A",mp:3,   tier:"C",desc:"Pull a target toward you (short range).",                                             upg:"Unknown."},
      {name:"Mock",             type:"A",mp:0,   tier:"C",desc:"Taunt an enemy but with a negative effect on yourself.",                              upg:"Unknown."},
      {name:"MORE ANGRIER!!!",  type:"A",mp:0,   tier:"C",desc:"Unknown rage ability.",                                                               upg:"Unknown."},
      {name:"Muscle Memory",    type:"A",mp:0,   tier:"C",desc:"Passive-style ability that tracks combat history.",                                    upg:"Unknown."},
      {name:"Nip",              type:"A",mp:2,   tier:"C",desc:"Weak quick bite attack.",                                                              upg:"Unknown."},
      {name:"Poke",             type:"A",mp:2,   tier:"C",desc:"Cheap weak melee poke.",                                                              upg:"Unknown."},
      {name:"Push",             type:"A",mp:2,   tier:"C",desc:"Push an adjacent unit one tile.",                                                     upg:"Unknown."},
      {name:"Slap",             type:"A",mp:0,   tier:"C",desc:"Free melee slap (basic attack variant).",                                             upg:"Unknown."},
      {name:"Stick!",           type:"A",mp:5,   tier:"B",desc:"Make a unit stick in place temporarily.",                                             upg:"Longer stick duration."},
      {name:"Sucker Punch",     type:"A",mp:5,   tier:"B",desc:"Sneak attack dealing bonus damage if undetected.",                                    upg:"Higher bonus dmg."},
      {name:"Tail Whip",        type:"A",mp:6,   tier:"B",desc:"Whip attack that hits units in front of and beside you.",                             upg:"Wider arc."},
      {name:"Paw Breaker",      type:"A",mp:5,   tier:"B",desc:"Attack that reduces target's STR.",                                                   upg:"Larger STR reduction."},
      {name:"Big Punch",        type:"A",mp:0,   tier:"B",desc:"Strong single-target melee punch.",                                                   upg:"Unknown."},
      {name:"Breaking Point",   type:"A",mp:0,   tier:"B",desc:"Gain bonus effects when your health is critically low.",                              upg:"Unknown."},
      {name:"Bloodzerk",        type:"A",mp:3,   tier:"B",desc:"Sacrifice HP to gain STR temporarily.",                                               upg:"Unknown."},
      {name:"Exhausting Blow",  type:"A",mp:0,   tier:"C",desc:"Attack that drains enemy mana.",                                                      upg:"Unknown."},
      // ── PASSIVES (25 total) ──
      {name:"Merciless",        type:"P",        tier:"S",desc:"Deal 10+ damage in a single hit: gain +2 Shield and refresh movement action.",        upg:"Assumed: lower threshold (8 dmg?) or extra effect."},
      {name:"Frenzy",           type:"P",        tier:"A",desc:"Gain +2 STR each time you down a unit.",                                              upg:"Assumed: +3 STR or also gain SPD."},
      {name:"Avenger",          type:"P",        tier:"A",desc:"Ally downed: gain All Stats Up and heal +8 HP. Triggers on minion deaths too.",       upg:"Upgrade+: grants an extra turn."},
      {name:"Fervor",           type:"P",        tier:"A",desc:"Heal +5 HP whenever you down a unit.",                                                upg:"Higher HP gain per kill."},
      {name:"Punch Face",       type:"P",        tier:"A",desc:"Basic attacks are critical hits if they hit the front of a unit.",                    upg:"Reduced positioning requirement."},
      {name:"Weapon Master",    type:"P",        tier:"A",desc:"Gain bonuses based on your equipped weapon type.",                                     upg:"Covers more weapon types."},
      {name:"Hulk Up",          type:"P",        tier:"A",desc:"Gain STR as you take damage.",                                                         upg:"Stronger STR scaling."},
      {name:"Scars",            type:"P",        tier:"B",desc:"Each injury you receive grants a permanent combat buff.",                              upg:"Stronger buffs per scar."},
      {name:"Thick Skull",      type:"P",        tier:"B",desc:"All injuries become Concussions. Gain +3 Shield per Concussion (cap 30).",            upg:"Higher Shield per Concussion."},
      {name:"Dumb Muscle",      type:"P",        tier:"B",desc:"Lose 1 INT on damage. ≤4 INT: +2 STR + Bruise on basic. 0 INT: +100% crit.",         upg:"Stronger bonuses at each threshold."},
      {name:"Math?",            type:"P",        tier:"B",desc:"All spells cost 3 mana each but can only be cast once per turn.",                     upg:"Unknown."},
      {name:"Most Valuable Cat",type:"P",        tier:"B",desc:"Gain bonus effects when you are the highest-stat cat on the field.",                  upg:"Unknown."},
      {name:"Dual Wield",       type:"P",        tier:"B",desc:"Gain benefits from wielding two weapons simultaneously.",                              upg:"Unknown."},
      {name:"Shoulder Check",   type:"P",        tier:"B",desc:"Gain bonus knockback damage.",                                                         upg:"Unknown."},
      {name:"Skullcrack",       type:"P",        tier:"B",desc:"Your melee hits have a chance to Stun.",                                              upg:"Higher Stun chance."},
      {name:"Vengeful",         type:"P",        tier:"B",desc:"Gain STR when an ally takes damage.",                                                  upg:"Higher STR gain."},
      {name:"Smash!",           type:"P",        tier:"B",desc:"Your melee attacks break enemy armor/Shield.",                                         upg:"More Shield broken per hit."},
      {name:"Underdog",         type:"P",        tier:"B",desc:"Gain bonus effects when you are outnumbered by enemies.",                              upg:"Stronger underdog bonuses."},
      {name:"Turtle Style",     type:"P",        tier:"B",desc:"Gain Shield when hit.",                                                               upg:"More Shield gained."},
      {name:"Hamster Style",    type:"P",        tier:"B",desc:"Unique movement and combo mechanic.",                                                  upg:"Unknown."},
      {name:"Rat Style",        type:"P",        tier:"C",desc:"Niche positional effect.",                                                             upg:"Unknown."},
      {name:"Hit Me",           type:"P",        tier:"C",desc:"Taking damage triggers a benefit.",                                                    upg:"Unknown."},
      {name:"Boned",            type:"P",        tier:"C",desc:"Bone-related passive debuff/buff.",                                                    upg:"Unknown."},
      {name:"Patellar Reflex",  type:"P",        tier:"C",desc:"Auto-react to being hit.",                                                             upg:"Unknown."},
      {name:"OVERPOWERED!!!",   type:"P",        tier:"B",desc:"Gain massive random bonuses (high variance).",                                         upg:"Unknown."},
    ],
  },

  Mage: {
    icon:"🔥", role:"Ranged Magic DPS · AoE Glass Cannon",
    combos:["Enlightened + Hyper Beam (free mega beam every turn at full mana)","Two + Meteor Storm (double-cast the big AoE)","Learn From Me (share spells with all allies)","Fire/Ice/Lightning Aspect + matching surge spells"],
    abilities:[
      // ── ACTIVES (52 total) ──
      {name:"Hyper Beam",          type:"A",mp:3,  tier:"S",desc:"Target a tile. At start of your next turn, unleash a mega beam. Once per turn.",   upg:"Wider beam or less delay."},
      {name:"Meteor Storm",        type:"A",mp:10, tier:"A",desc:"Summon meteors on random tiles in a huge area. Can Stun/Burn/create rocks.",        upg:"More meteors or larger area."},
      {name:"Mega Blast",          type:"A",mp:13, tier:"A",desc:"Deal high magic damage in a cone.",                                                  upg:"Wider cone or added element."},
      {name:"Homing Blasts",       type:"A",mp:7,  tier:"A",desc:"Shoot 3 Magic Missiles at random enemies. No LoS needed.",                          upg:"4 missiles or guided targeting."},
      {name:"Cryo-Heal",           type:"A",mp:8,  tier:"A",desc:"Heal a unit and inflict Freeze 1 on them within range 3.",                           upg:"Freeze 2 or larger heal."},
      {name:"Teleport",            type:"A",mp:6,  tier:"A",desc:"Teleport to any tile on the battlefield.",                                           upg:"Bonus effect on arrival."},
      {name:"Telefrag",            type:"A",mp:6,  tier:"A",desc:"Teleport to an occupied tile, dealing massive damage.",                              upg:"Larger explosion on impact."},
      {name:"Blizzard",            type:"A",mp:12, tier:"A",desc:"Large AoE ice storm that Freezes and damages.",                                      upg:"Larger AoE or Freeze 2."},
      {name:"Inferno",             type:"A",mp:12, tier:"A",desc:"Large AoE fire storm that Burns and damages.",                                       upg:"Larger AoE or higher Burn."},
      {name:"Thunderburst",        type:"A",mp:12, tier:"A",desc:"Large AoE lightning burst that Stuns and damages.",                                  upg:"Larger AoE or longer Stun."},
      {name:"Chain Lightning",     type:"A",mp:7,  tier:"A",desc:"Lightning bolt that chains to adjacent units.",                                      upg:"More chains or added Stun."},
      {name:"Bolt",                type:"A",mp:7,  tier:"A",desc:"Targeted lightning bolt for solid single-target damage.",                            upg:"Splits into 2 bolts."},
      {name:"Fire Blast",          type:"A",mp:7,  tier:"A",desc:"Fire bolt dealing magic damage and applying Burn.",                                  upg:"Higher Burn stacks."},
      {name:"Frost Blast",         type:"A",mp:4,  tier:"A",desc:"Ice blast dealing magic damage and applying Freeze.",                                upg:"Freeze 2 at Upgrade+."},
      {name:"Energy Blast",        type:"A",mp:7,  tier:"A",desc:"Pure energy blast — reliable neutral magic damage.",                                 upg:"Added element or bonus dmg."},
      {name:"Surf",                type:"A",mp:7,  tier:"A",desc:"Water wave attack — deals dmg and creates water tiles.",                             upg:"Wider wave or more water."},
      {name:"Wind Slash",          type:"A",mp:4,  tier:"A",desc:"Wind slash attack dealing dmg in a line.",                                           upg:"Wider slash or Knockback."},
      {name:"Gust",                type:"A",mp:3,  tier:"A",desc:"Cheap wind push that deals minor dmg and Knockback.",                                upg:"More knockback."},
      {name:"Freezer Burn",        type:"A",mp:8,  tier:"A",desc:"Hit a unit with ice then fire — combines both elements.",                            upg:"Stronger elemental reaction."},
      {name:"Icicle Zapper",       type:"A",mp:8,  tier:"A",desc:"Shoot an ice+lightning combo projectile.",                                           upg:"Stronger combo effect."},
      {name:"Firebolt",            type:"A",mp:8,  tier:"A",desc:"Focused fire bolt — higher damage than Fire Blast.",                                 upg:"Even higher dmg."},
      {name:"Wall of Fire",        type:"A",mp:8,  tier:"A",desc:"Create a wall of fire that damages units that cross it.",                            upg:"Wider wall or longer duration."},
      {name:"Warp",                type:"A",mp:4,  tier:"A",desc:"Swap positions with another unit.",                                                  upg:"Can swap allies and enemies."},
      {name:"Switch",              type:"A",mp:5,  tier:"A",desc:"Switch positions of two target units.",                                              upg:"Target more units."},
      {name:"Whirlpool",           type:"A",mp:7,  tier:"A",desc:"Create a water vortex that pulls and damages units.",                                upg:"Stronger pull or larger area."},
      {name:"Replicate",           type:"A",mp:5,  tier:"A",desc:"Copy the effect of the last spell cast.",                                            upg:"Copy 2 spells at Upgrade+."},
      {name:"Teach",               type:"A",mp:5,  tier:"A",desc:"Grant an ally a copy of one of your spells in their bonus slot.",                   upg:"Grant 2 spells."},
      {name:"Magnify",             type:"A",mp:5,  tier:"A",desc:"Double the effect of your next spell cast.",                                         upg:"Triple effect at Upgrade+."},
      {name:"Tri-Attack",          type:"A",mp:7,  tier:"A",desc:"Fire three elemental shots simultaneously.",                                          upg:"Four shots or stronger elements."},
      {name:"Fire Surge",          type:"A",mp:5,  tier:"B",desc:"Cheap fire attack — building into surge combos.",                                    upg:"Upgrade+: stronger surge effect."},
      {name:"Ice Surge",           type:"A",mp:5,  tier:"B",desc:"Cheap ice attack — building into surge combos.",                                    upg:"Stronger surge."},
      {name:"Lightning Surge",     type:"A",mp:5,  tier:"B",desc:"Cheap lightning attack — building into surge combos.",                               upg:"Stronger surge."},
      {name:"Smolder",             type:"A",mp:3,  tier:"B",desc:"Apply a lingering Burn that deals damage over time.",                                upg:"Higher Burn stacks."},
      {name:"Jolt",                type:"A",mp:3,  tier:"B",desc:"Cheap electric shock that may Stun.",                                               upg:"Higher Stun chance."},
      {name:"Chill",               type:"A",mp:3,  tier:"B",desc:"Apply a mild Freeze/Slow effect.",                                                   upg:"Freeze 2 at Upgrade+."},
      {name:"Divide",              type:"A",mp:3,  tier:"B",desc:"Split a unit's HP effect across multiple targets.",                                  upg:"Unknown."},
      {name:"Shatter",             type:"A",mp:4,  tier:"B",desc:"Deal massive damage to a Frozen unit.",                                              upg:"Works at Freeze 1 instead of 2."},
      {name:"Corrupt",             type:"A",mp:5,  tier:"B",desc:"Apply a corruptive debuff to a unit.",                                              upg:"Stronger corruption."},
      {name:"Inspire",             type:"A",mp:3,  tier:"B",desc:"Buff an ally's next spell cast.",                                                    upg:"Buff lasts longer."},
      {name:"Mana Meld",           type:"A",mp:0,  tier:"B",desc:"Transfer mana between units.",                                                       upg:"Transfer more mana."},
      {name:"Chaos Teleport",      type:"A",mp:1,  tier:"B",desc:"Teleport to a random tile for 1 mana.",                                              upg:"Better tile quality at Upgrade+."},
      {name:"Magic Dart",          type:"A",mp:0,  tier:"B",desc:"Free basic magic projectile.",                                                        upg:"Added element or bonus."},
      {name:"Magic Missile",       type:"A",mp:0,  tier:"B",desc:"Free ranged magic damage — 0 mana filler.",                                          upg:"Added element or bonus dmg."},
      {name:"Magic Missile",       type:"A",mp:5,  tier:"B",desc:"Paid version: shoot magic missiles at multiple enemies.",                            upg:"More missiles."},
      {name:"Crescendo",           type:"A",mp:0,  tier:"B",desc:"Builds up power each turn for a big release.",                                      upg:"Unknown."},
      {name:"Deal with the Devil", type:"A",mp:0,  tier:"C",desc:"High-risk high-reward dark pact ability.",                                           upg:"Unknown."},
      {name:"Forbidden Flame",     type:"A",mp:0,  tier:"C",desc:"Ultra-powerful fire spell with major drawback.",                                     upg:"Unknown."},
      {name:"Forbidden Flood",     type:"A",mp:0,  tier:"C",desc:"Ultra-powerful water spell with major drawback.",                                    upg:"Unknown."},
      {name:"Forbidden Frost",     type:"A",mp:0,  tier:"C",desc:"Ultra-powerful frost spell with major drawback.",                                    upg:"Unknown."},
      {name:"Forbidden Fulmination",type:"A",mp:0, tier:"C",desc:"Ultra-powerful lightning spell with major drawback.",                               upg:"Unknown."},
      {name:"Absorb",              type:"A",mp:0,  tier:"B",desc:"Absorb a projectile or magic effect to gain mana/shield.",                          upg:"Absorb more types."},
      {name:"Black Magic",         type:"A",mp:0,  tier:"B",desc:"Dark magic ability with multiple effects.",                                          upg:"Unknown."},
      // ── PASSIVES (25 total) ──
      {name:"Two",                 type:"P",       tier:"S",desc:"If you cast only 1 spell last turn, double-cast your next spell.",                   upg:"Wider timing window."},
      {name:"Learn From Me",       type:"P",       tier:"S",desc:"When you cast a spell, all allies gain access to that spell in their bonus slot.",   upg:"Allies can cast it more times."},
      {name:"Enlightened",         type:"P",       tier:"S",desc:"At full mana: next 3 spells are free. Upgrade+: ALL spells free once/turn.",         upg:"ALL spells free at full mana once per turn."},
      {name:"Ice Aspect",          type:"P",       tier:"A",desc:"Your attacks apply Freeze. Gain bonuses in ice-related situations.",                  upg:"Higher Freeze stacks on application."},
      {name:"Fire Aspect",         type:"P",       tier:"A",desc:"Your attacks apply Burn. Synergizes with fire spells.",                              upg:"Higher Burn stacks."},
      {name:"Lightning Aspect",    type:"P",       tier:"A",desc:"Your attacks apply Shock/Stun. Synergizes with lightning spells.",                   upg:"Higher Stun chance."},
      {name:"Resonance",           type:"P",       tier:"A",desc:"Spells you cast gain power based on recent spell history.",                           upg:"Longer resonance window."},
      {name:"Force Field",         type:"P",       tier:"A",desc:"Gain a shield bubble that absorbs incoming damage.",                                  upg:"Larger shield capacity."},
      {name:"Synthesize",          type:"P",       tier:"A",desc:"Gain mana or bonuses when elements interact.",                                       upg:"Stronger synthesis bonuses."},
      {name:"Paw Missile",         type:"P",       tier:"A",desc:"Fire a missile from your paw on each turn.",                                         upg:"Stronger missile."},
      {name:"Burning Paws",        type:"P",       tier:"B",desc:"Basic attacks apply Burn.",                                                           upg:"Higher Burn stacks."},
      {name:"Ice Paws",            type:"P",       tier:"B",desc:"Basic attacks apply Freeze.",                                                         upg:"Higher Freeze."},
      {name:"Lightning Paws",      type:"P",       tier:"B",desc:"Basic attacks apply Shock.",                                                          upg:"Higher Shock/chain."},
      {name:"Charge Up",           type:"P",       tier:"B",desc:"Build charges that power up your next spell.",                                        upg:"More charges or stronger burst."},
      {name:"Overload",            type:"P",       tier:"B",desc:"Your spells deal AoE splash damage.",                                                 upg:"Larger splash radius."},
      {name:"Splash Damage",       type:"P",       tier:"B",desc:"Attacks deal some damage to adjacent units.",                                         upg:"Higher splash amount."},
      {name:"Elemental Attunement",type:"P",       tier:"B",desc:"Bonus effects based on which element you use most.",                                  upg:"Stronger attunement bonus."},
      {name:"Epiphany",            type:"P",       tier:"B",desc:"Random bonus effect at the start of battle.",                                         upg:"Better RNG pool."},
      {name:"Long Cast",           type:"P",       tier:"B",desc:"Spells cast have extended range.",                                                    upg:"Further range."},
      {name:"Magic Guru",          type:"P",       tier:"B",desc:"Bonus mana regen or mana-related benefits.",                                          upg:"Higher regen."},
      {name:"Light Up the Stage",  type:"P",       tier:"B",desc:"Buff allies when you cast spells.",                                                   upg:"Stronger ally buff."},
      {name:"Latent Energy",       type:"P",       tier:"B",desc:"Store energy over turns for a burst.",                                               upg:"Larger burst."},
      {name:"One",                 type:"P",       tier:"B",desc:"If you cast exactly 1 spell per turn, gain bonus effects.",                           upg:"Better bonus."},
      {name:"Three",               type:"P",       tier:"B",desc:"If you cast 3 spells in a turn, gain bonus effects.",                                upg:"Better bonus."},
      {name:"Four",                type:"P",       tier:"B",desc:"If you cast 4+ spells in a turn, gain bonus effects.",                               upg:"Better bonus."},
      {name:"Five",                type:"P",       tier:"C",desc:"Requires 5 spells in a turn — unrealistic without massive mana.",                   upg:"Unknown."},
    ],
  },

  Medic: {
    icon:"✨", role:"Support Healer · Party Structural Glue (S-tier, ~90% win rate with Fighter)",
    combos:["Revive + Adoubment (full restore + stat buff + debuff clear)","Ranged Medic passive + Prayer (AoE heal from safe backline)","Purifier passive (free debuff cleanse every basic attack)","Protect the Weak passive (passive dodge for low HP allies)"],
    abilities:[
      // ── ACTIVES (52 total) ──
      {name:"Prayer",            type:"A",mp:4,  tier:"S",desc:"Heal units in an area around a target.",                                              upg:"Larger AoE or higher HP healed."},
      {name:"Revive",            type:"A",mp:8,  tier:"S",desc:"Revive a body to 50% HP and cure one injury. Always prefer over Awaken late game.",   upg:"Cures 2 injuries at Upgrade+."},
      {name:"Adoubment",         type:"A",mp:5,  tier:"S",desc:"Heal unit, remove debuffs, +1 random stat, become Alpha. Alpha gets infinite range.", upg:"+2 stat or heals more HP."},
      {name:"Awaken",            type:"A",mp:1,  tier:"A",desc:"Revive a body to 1 HP. Cheapest emergency revive.",                                   upg:"Revive to higher HP."},
      {name:"Healing Word",      type:"A",mp:5,  tier:"A",desc:"Targeted ranged heal on a single ally.",                                              upg:"Higher heal amount."},
      {name:"Cleanse",           type:"A",mp:3,  tier:"A",desc:"Remove all debuffs from units in an area.",                                            upg:"Larger area."},
      {name:"Friend or Foe",     type:"A",mp:5,  tier:"A",desc:"Ranged AoE — heals allies, damages enemies.",                                          upg:"Larger AoE."},
      {name:"Born Again",        type:"A",mp:10, tier:"A",desc:"Full revive with stat boosts. Expensive but powerful.",                                upg:"Revives with higher % HP."},
      {name:"Holy Dash",         type:"A",mp:8,  tier:"A",desc:"Dash forward, heal a unit and grant them a random stat boost.",                       upg:"Longer dash range."},
      {name:"Cure Wounds",       type:"A",mp:5,  tier:"A",desc:"Direct single-target heal.",                                                           upg:"Higher heal amount."},
      {name:"Guardian Angel",    type:"A",mp:8,  tier:"A",desc:"Shield an ally so they survive the next lethal hit.",                                 upg:"Lasts 2 hits at Upgrade+."},
      {name:"Haste",             type:"A",mp:3,  tier:"A",desc:"Grant an ally extra movement or SPD this turn.",                                       upg:"Bigger speed bonus."},
      {name:"Booster",           type:"A",mp:6,  tier:"A",desc:"Boost an ally's stats for the next turn.",                                            upg:"Stronger boost."},
      {name:"Anoint",            type:"A",mp:4,  tier:"A",desc:"Apply a holy blessing that buffs and slightly heals.",                                upg:"Higher buff value."},
      {name:"Benediction",       type:"A",mp:5,  tier:"A",desc:"Grant an ally a stacking blessing that improves over time.",                          upg:"Stronger blessing."},
      {name:"Chosen Warrior",    type:"A",mp:6,  tier:"A",desc:"Massively buff a single ally for one powerful turn.",                                  upg:"Longer buff duration."},
      {name:"Hallowed Ground",   type:"A",mp:5,  tier:"A",desc:"Create a holy zone that heals allies standing in it.",                                upg:"Larger zone or stronger heal."},
      {name:"Holy Light",        type:"A",mp:12, tier:"A",desc:"Massive area heal that also damages undead.",                                          upg:"Larger AoE or higher values."},
      {name:"Enlighten",         type:"A",mp:8,  tier:"A",desc:"Grant an ally insight — boosts their INT and mana regen.",                            upg:"Higher stat gain."},
      {name:"Healing Fall",      type:"A",mp:8,  tier:"A",desc:"Heal all allies that fall to low HP simultaneously.",                                 upg:"Triggers at higher HP%."},
      {name:"Circle of Protection",type:"A",mp:8,tier:"A",desc:"Create a protective circle shielding allies inside.",                                 upg:"Larger circle."},
      {name:"Stimulants",        type:"A",mp:4,  tier:"A",desc:"Give an ally a speed and stat boost.",                                                upg:"Stronger boost."},
      {name:"Buddy Up",          type:"A",mp:4,  tier:"A",desc:"Pair with an ally — both gain a mutual buff.",                                        upg:"Stronger mutual buff."},
      {name:"Grace",             type:"A",mp:3,  tier:"A",desc:"Give a small but free grace buff to an ally.",                                        upg:"Slightly bigger buff."},
      {name:"Healing Salve",     type:"A",mp:4,  tier:"A",desc:"Apply a healing salve that heals HP over several turns.",                             upg:"Faster tick or more HP."},
      {name:"Pray",              type:"A",mp:4,  tier:"A",desc:"Channel prayer to heal nearby allies.",                                                upg:"Wider heal range."},
      {name:"Fury Heal",         type:"A",mp:5,  tier:"A",desc:"Heal based on how much damage was dealt this turn.",                                  upg:"Higher scaling."},
      {name:"Stand In",          type:"A",mp:2,  tier:"A",desc:"Take a hit for an ally — swap positions and absorb damage.",                          upg:"Absorb more damage."},
      {name:"Swift Servant",     type:"A",mp:4,  tier:"A",desc:"Grant an ally an extra action this turn.",                                            upg:"Full extra turn at Upgrade+."},
      {name:"Call Over",         type:"A",mp:2,  tier:"A",desc:"Call an ally to your position.",                                                      upg:"Works at longer range."},
      {name:"Rally",             type:"A",mp:8,  tier:"A",desc:"Rally all allies — granting a party-wide stat boost.",                                upg:"Stronger rally."},
      {name:"An Eye for an Eye", type:"A",mp:5,  tier:"B",desc:"Retaliation blessing — next hit on the target triggers dmg back.",                   upg:"More retaliation dmg."},
      {name:"Malaise",           type:"A",mp:5,  tier:"B",desc:"Apply a weakening curse to an enemy.",                                                upg:"Stronger malaise."},
      {name:"Rebuke",            type:"A",mp:5,  tier:"B",desc:"Holy bolt that damages enemies, especially undead.",                                  upg:"Holy damage bonus."},
      {name:"Crusade",           type:"A",mp:3,  tier:"B",desc:"Short charge — small holy dmg on adjacent units.",                                    upg:"Wider area."},
      {name:"Convert",           type:"A",mp:6,  tier:"B",desc:"Convert an enemy to fight for you.",                                                  upg:"Works on stronger enemies."},
      {name:"Witch Hunt",        type:"A",mp:4,  tier:"B",desc:"Mark an enemy — nearby allies deal bonus damage to it.",                              upg:"Longer mark duration."},
      {name:"Heretic Mark",      type:"A",mp:10, tier:"B",desc:"Heavily debuff a target.",                                                            upg:"Stronger debuffs."},
      {name:"Wrath of God",      type:"A",mp:10, tier:"B",desc:"Massive holy attack dealing extreme damage.",                                          upg:"Wider AoE."},
      {name:"Zealot",            type:"A",mp:7,  tier:"B",desc:"Attack while healing — combo offense/support.",                                       upg:"Better balance of both effects."},
      {name:"Blinding Lights",   type:"A",mp:4,  tier:"B",desc:"Blind nearby enemies, causing them to miss attacks.",                                 upg:"Wider blind or longer duration."},
      {name:"Reverse Damage",    type:"A",mp:4,  tier:"B",desc:"Reverse the next damage an ally takes into a heal.",                                  upg:"Triggers twice at Upgrade+."},
      {name:"Holy Weapon",       type:"A",mp:0,  tier:"B",desc:"Imbue your basic attack with holy damage.",                                           upg:"Higher holy damage."},
      {name:"Divine Protection", type:"A",mp:0,  tier:"B",desc:"Passive divine shield for the whole party.",                                          upg:"Stronger shield."},
      {name:"Divine Gift",       type:"A",mp:0,  tier:"B",desc:"Gift of divine power to an ally.",                                                    upg:"Unknown."},
      {name:"Wish",              type:"A",mp:3,  tier:"B",desc:"Wish for a random beneficial effect.",                                                upg:"Better RNG outcomes."},
      {name:"Emergency",         type:"A",mp:5,  tier:"A",desc:"Fast heal — can be used immediately when HP drops critically.",                       upg:"Triggers automatically at Upgrade+."},
      {name:"Turn Foe",          type:"A",mp:2,  tier:"B",desc:"Force an enemy to face away.",                                                        upg:"Unknown."},
      {name:"Open Wounds",       type:"A",mp:8,  tier:"C",desc:"Deal more damage the lower target's HP. Counter-synergy for a healer.",               upg:"Stronger scaling."},
      {name:"Ethereal",          type:"A",mp:16, tier:"C",desc:"Make yourself temporarily invulnerable — extremely expensive.",                        upg:"Slightly cheaper."},
      {name:"Melee Attack / Heal",type:"A",mp:0, tier:"A",desc:"Basic attack — damages enemies, heals allies (unique mechanic).",                     upg:"Higher heal/dmg values."},
      {name:"Ranged Attack / Heal",type:"A",mp:0,tier:"A",desc:"Ranged basic — heals allies, damages enemies at range.",                              upg:"Extended range."},
      // ── PASSIVES (25 total) ──
      {name:"Ranged Medic",       type:"P",       tier:"S",desc:"Your basic attack heals allies at range — free heal every turn with no mana cost.",  upg:"Extended healing range."},
      {name:"Protect the Weak",   type:"P",       tier:"S",desc:"Allies at low HP gain higher dodge chance passively.",                                upg:"Higher dodge or lower HP threshold."},
      {name:"Purifier",           type:"P",       tier:"A",desc:"Your basic attack removes debuffs from allies it hits.",                              upg:"Removes 2 debuffs per hit."},
      {name:"Healing Aura",       type:"P",       tier:"A",desc:"Passively heal adjacent allies at the end of each turn.",                             upg:"Wider aura or higher heal."},
      {name:"Natural Healer",     type:"P",       tier:"A",desc:"Heal more HP from all your healing abilities.",                                       upg:"Higher bonus%."},
      {name:"Blessed",            type:"P",       tier:"A",desc:"Your heals also grant a small buff to the target.",                                   upg:"Stronger buff."},
      {name:"Eternal",            type:"P",       tier:"A",desc:"Passively reduce injury severity for all allies.",                                    upg:"Unknown."},
      {name:"Morale Boost",       type:"P",       tier:"A",desc:"Party-wide morale effect granting stat bonuses.",                                     upg:"Stronger morale bonuses."},
      {name:"Godspeed",           type:"P",       tier:"A",desc:"Gain SPD bonus or movement boost.",                                                   upg:"Higher SPD bonus."},
      {name:"God Warrior",        type:"P",       tier:"A",desc:"Gain STR/CON bonus for tanking alongside healing.",                                   upg:"Higher bonuses."},
      {name:"Breath of Life",     type:"P",       tier:"A",desc:"Revive a downed ally automatically at end of round with low HP.",                    upg:"Higher revive HP."},
      {name:"Angelic Inspiration",type:"P",       tier:"A",desc:"Inspire all allies with angel energy — stat boosts.",                                 upg:"Stronger inspiration."},
      {name:"Caretaker",          type:"P",       tier:"A",desc:"Bonus effects when healing injured or debuffed allies.",                              upg:"Triggers more often."},
      {name:"Sharing is Caring",  type:"P",       tier:"A",desc:"When you heal an ally, gain a small benefit yourself.",                               upg:"Bigger self-benefit."},
      {name:"Top Off",            type:"P",       tier:"B",desc:"Bonus heal when target is already at full HP.",                                       upg:"Triggers on more targets."},
      {name:"Evil Patron",        type:"P",       tier:"B",desc:"Dark blessing — sacrifice your own HP to buff allies.",                               upg:"Better trade ratio."},
      {name:"Venerated Touch",    type:"P",       tier:"B",desc:"Touch-based healing bonus.",                                                          upg:"Higher heal bonus."},
      {name:"Thou Shalt Not Kill",type:"P",       tier:"B",desc:"Prevent ally deaths — killing blow on allies does 1 HP instead.",                    upg:"Wider trigger condition."},
      {name:"Thou Shalt Not Covet",type:"P",      tier:"C",desc:"Prevents taking certain actions.",                                                   upg:"Unknown."},
      {name:"Thou Shalt Obey",    type:"P",       tier:"C",desc:"Control-related passive.",                                                            upg:"Unknown."},
      {name:"Heathens!",          type:"P",       tier:"C",desc:"Anti-undead bonus.",                                                                  upg:"Unknown."},
      {name:"Alms for the Poor",  type:"P",       tier:"B",desc:"Gain coins or items by healing.",                                                     upg:"Better rewards."},
      {name:"Blessing of Holy Fire",type:"P",     tier:"B",desc:"Healing abilities also deal holy fire damage to nearby enemies.",                    upg:"More fire damage."},
      {name:"Blessing of Spirit", type:"P",       tier:"A",desc:"Team gains end-of-turn healing, mana, and stat boosts just for existing.",           upg:"Higher bonus values."},
      {name:"Enchanted Relic",    type:"P",       tier:"B",desc:"An equipped item gains enhanced magical properties.",                                 upg:"Stronger enchantment."},
    ],
  },

  Tank: {
    icon:"🛡️", role:"Frontline Absorber · Protector (CON +4, highest single stat in game)",
    combos:["Steelskin (free 0mp = +99 Brace for one turn)","Pet Rocks + Stone Orbit (rock army from taking damage)","Goad + Spin (pull cluster + delete)","Hardy (full HP every battle = eliminates attrition)"],
    abilities:[
      // ── ACTIVES (52 total) ──
      {name:"Steelskin",        type:"A",mp:0,  tier:"S",desc:"Gain +99 Brace until next turn. Disabled until you take 25 total dmg.",             upg:"Activates sooner or lasts longer."},
      {name:"Goad",             type:"A",mp:3,  tier:"A",desc:"Force an enemy to move toward you.",                                                  upg:"AoE Goad at Upgrade+."},
      {name:"Body Guard",       type:"A",mp:2,  tier:"A",desc:"Next time an ally is targeted by an enemy, switch places with that ally.",            upg:"Can trigger twice per turn."},
      {name:"Earthquake",       type:"A",mp:7,  tier:"A",desc:"Large-area ground slam that damages and Slows all units.",                            upg:"Wider AoE or adds Stun."},
      {name:"Pincushion",       type:"A",mp:0,  tier:"A",desc:"Gain +3 Thorns — uses up your movement action.",                                     upg:"Higher Thorns stacks."},
      {name:"Suplex",           type:"A",mp:5,  tier:"A",desc:"Grab an adjacent unit and slam them for heavy damage.",                               upg:"Wider range or adds Stun."},
      {name:"Rock Toss",        type:"A",mp:5,  tier:"A",desc:"Throw a rock at an enemy for ranged damage.",                                         upg:"Larger rock or more dmg."},
      {name:"Rock Blast",       type:"A",mp:6,  tier:"A",desc:"Blast a rock that deals damage and knockback.",                                       upg:"More rocks or wider blast."},
      {name:"Rock Crusher",     type:"A",mp:4,  tier:"A",desc:"Crush rocks for AoE damage to adjacent units.",                                       upg:"Larger crush AoE."},
      {name:"Rock Song",        type:"A",mp:6,  tier:"A",desc:"Sing a rock-based song that buffs allies or debuffs enemies.",                        upg:"Stronger effect."},
      {name:"Rock Tomb",        type:"A",mp:8,  tier:"A",desc:"Summon rocks to entomb an enemy in place.",                                           upg:"More rocks or longer entomb."},
      {name:"Headbutt",         type:"A",mp:8,  tier:"A",desc:"Powerful headbutt that stuns and deals heavy damage.",                                upg:"Longer Stun duration."},
      {name:"Tantrum",          type:"A",mp:3,  tier:"A",desc:"Wild attack hitting all nearby units.",                                               upg:"Wider range or more hits."},
      {name:"Swap",             type:"A",mp:5,  tier:"A",desc:"Swap your position with an adjacent ally.",                                            upg:"Works at range."},
      {name:"Trample Dash",     type:"A",mp:6,  tier:"A",desc:"Dash through enemies, dealing damage to all in your path.",                           upg:"Longer dash or more dmg."},
      {name:"Intimidate",       type:"A",mp:5,  tier:"A",desc:"Intimidate nearby enemies, reducing their attack stats.",                              upg:"Stronger debuff or wider range."},
      {name:"Iron Head",        type:"A",mp:6,  tier:"A",desc:"Hardened headbutt that ignores enemy Shield.",                                        upg:"More damage."},
      {name:"Toss",             type:"A",mp:3,  tier:"A",desc:"Throw an adjacent unit in a direction.",                                              upg:"Longer throw distance."},
      {name:"Gore",             type:"A",mp:5,  tier:"A",desc:"Ram into an enemy, dealing high damage and applying Bleed.",                          upg:"Higher Bleed stacks."},
      {name:"Anchor",           type:"A",mp:6,  tier:"A",desc:"Anchor yourself in place gaining massive defense.",                                   upg:"Higher defense or duration."},
      {name:"Fault Line",       type:"A",mp:5,  tier:"A",desc:"Create a crack in the ground that damages and trips enemies.",                        upg:"Longer fault line."},
      {name:"Fissure",          type:"A",mp:5,  tier:"A",desc:"Open a ground fissure beneath a unit.",                                              upg:"Wider fissure."},
      {name:"Gang Up",          type:"A",mp:9,  tier:"A",desc:"Signal allies to attack the same target for bonus damage.",                           upg:"More bonus damage."},
      {name:"Stone Breath",     type:"A",mp:6,  tier:"A",desc:"Breathe rocky shards in a cone dealing damage.",                                      upg:"Wider cone."},
      {name:"Backbreaker",      type:"A",mp:6,  tier:"A",desc:"Melee attack that reduces enemy CON.",                                                upg:"Larger CON reduction."},
      {name:"Belly Flop",       type:"A",mp:6,  tier:"A",desc:"Belly flop onto adjacent units dealing AoE damage.",                                  upg:"Larger AoE."},
      {name:"Big Rock",         type:"A",mp:7,  tier:"A",desc:"Summon a very large rock for battlefield control.",                                   upg:"Rock has more HP."},
      {name:"Chew",             type:"A",mp:5,  tier:"A",desc:"Bite and chew an enemy for damage and healing.",                                      upg:"More HP healed."},
      {name:"Chew Cud",         type:"A",mp:3,  tier:"B",desc:"Slow chew that gradually heals you over time.",                                       upg:"More HP per tick."},
      {name:"Bowl Over",        type:"A",mp:2,  tier:"B",desc:"Cheap knock a unit back one tile.",                                                   upg:"More knockback."},
      {name:"Clap",             type:"A",mp:3,  tier:"B",desc:"Clap shockwave that Stuns adjacent units.",                                           upg:"Wider stun area."},
      {name:"Demolish",         type:"A",mp:3,  tier:"B",desc:"Destroy obstacles and terrain, dealing dmg.",                                         upg:"Larger demolish area."},
      {name:"Batter Up",        type:"A",mp:5,  tier:"B",desc:"Wide baseball-style swing hitting multiple units.",                                   upg:"Wider swing."},
      {name:"Barbed Wire",      type:"A",mp:3,  tier:"B",desc:"Place barbed wire that damages enemies that pass through it.",                        upg:"More wire or higher dmg."},
      {name:"Aftershock",       type:"A",mp:4,  tier:"B",desc:"Follow-up ground strike that hits after a Knockback.",                               upg:"Triggers more easily."},
      {name:"Throw Scrap",      type:"A",mp:5,  tier:"B",desc:"Throw scrap metal at an enemy.",                                                      upg:"More scrap or higher dmg."},
      {name:"To the Rescue!",   type:"A",mp:5,  tier:"B",desc:"Rush to an ally's position to protect them.",                                         upg:"Faster movement."},
      {name:"Ass Blast",        type:"A",mp:4,  tier:"B",desc:"Gas attack that deals area dmg behind you.",                                          upg:"Wider blast."},
      {name:"Nudge",            type:"A",mp:3,  tier:"C",desc:"Gently push a unit one tile.",                                                        upg:"Unknown."},
      {name:"Grab",             type:"A",mp:3,  tier:"B",desc:"Grab and hold an adjacent unit.",                                                     upg:"Longer hold."},
      {name:"Full Force",       type:"A",mp:8,  tier:"B",desc:"Deal maximum possible damage — all strength into one hit.",                           upg:"Even higher maximum."},
      {name:"Sandstorm",        type:"A",mp:4,  tier:"B",desc:"Create a sandstorm that blinds and damages nearby enemies.",                          upg:"Larger storm."},
      {name:"Gorgon Glare",     type:"A",mp:10, tier:"B",desc:"Petrify/Freeze an enemy with your gaze.",                                             upg:"Works at longer range."},
      {name:"Push Attack",      type:"A",mp:0,  tier:"B",desc:"Basic attack with knockback.",                                                         upg:"More knockback."},
      {name:"Plant Your Feet",  type:"A",mp:0,  tier:"B",desc:"Become immovable for a turn, gaining defense.",                                      upg:"Higher defense bonus."},
      {name:"Eat Rock",         type:"A",mp:1,  tier:"B",desc:"Eat a rock to heal yourself.",                                                         upg:"More HP per rock."},
      {name:"Lunge",            type:"A",mp:0,  tier:"B",desc:"Quick lunge at an adjacent unit.",                                                    upg:"Unknown."},
      {name:"Thicken",          type:"A",mp:2,  tier:"B",desc:"Temporarily increase your own bulk for better defense.",                              upg:"Higher defense gain."},
      {name:"Push Through",     type:"A",mp:4,  tier:"B",desc:"Push through an enemy, dealing dmg and moving past them.",                            upg:"More dmg on push."},
      {name:"Flip Flop",        type:"A",mp:0,  tier:"C",desc:"Flip your position awkwardly.",                                                        upg:"Unknown."},
      {name:"Supper",           type:"A",mp:0,  tier:"C",desc:"Eat to heal at an awkward time.",                                                      upg:"Unknown."},
      // ── PASSIVES (25 total) ──
      {name:"Hardy",            type:"P",        tier:"S",desc:"Heal to full HP at the start of each battle.",                                        upg:"Also clears a debuff or injury."},
      {name:"Hard Head",        type:"P",        tier:"S",desc:"Block all attacks that come from the front.",                                          upg:"Extended arc of front blocking."},
      {name:"Pet Rocks",        type:"P",        tier:"S",desc:"Rocks you spawn are alive with +3 HP. Spawn a rock at the start of each battle.",    upg:"Rocks have more HP or attack."},
      {name:"Scabs",            type:"P",        tier:"A",desc:"Gain +2 Shield when you take damage from an ability.",                                upg:"+3 Shield per hit."},
      {name:"Thorns",           type:"P",        tier:"A",desc:"Gain Thorns passively — enemies take dmg when attacking you.",                        upg:"Higher Thorns value."},
      {name:"Chain Knockback",  type:"P",        tier:"A",desc:"Your knockback chains — units knocked back collide with others.",                     upg:"Upgrade+: +2 all knockback, +1 chain dmg."},
      {name:"Heavy Handed",     type:"P",        tier:"A",desc:"Your knockback effects deal more damage.",                                            upg:"More damage per knockback."},
      {name:"Protective",       type:"P",        tier:"A",desc:"Reduce damage dealt to adjacent allies.",                                             upg:"Better damage reduction."},
      {name:"Rock Aspect",      type:"P",        tier:"A",desc:"Gain bonuses from having rocks on the field.",                                        upg:"Higher bonus per rock."},
      {name:"Mountain Form",    type:"P",        tier:"A",desc:"Become stationary to gain massive defense bonuses.",                                  upg:"Even higher defense."},
      {name:"Home Run",         type:"P",        tier:"B",desc:"Your knockbacks launch enemies extra far.",                                            upg:"More launch distance."},
      {name:"Plow",             type:"P",        tier:"B",desc:"Moving through terrain destroys it and deals damage.",                                upg:"Higher plow damage."},
      {name:"Thunder Thighs",   type:"P",        tier:"B",desc:"Your movement causes shockwaves.",                                                    upg:"Stronger shockwave."},
      {name:"Wide Load",        type:"P",        tier:"B",desc:"You take up more space — blocking more tiles.",                                       upg:"Even wider."},
      {name:"Wrestlemaniac",    type:"P",        tier:"B",desc:"Grab abilities are enhanced.",                                                         upg:"Stronger grab effects."},
      {name:"Cat-A-Pult",       type:"P",        tier:"B",desc:"Launch allies or enemies greater distances.",                                         upg:"Further launch."},
      {name:"Bouncer",          type:"P",        tier:"B",desc:"Enemies that hit you get knocked back.",                                              upg:"More knockback."},
      {name:"Follow Up",        type:"P",        tier:"B",desc:"After an ally attacks, you get a bonus attack.",                                      upg:"More Follow Up triggers."},
      {name:"Shoving Match",    type:"P",        tier:"B",desc:"Bonus effects from pushing and being pushed.",                                         upg:"Better bonuses."},
      {name:"Priority Target",  type:"P",        tier:"B",desc:"Force all enemies to target you.",                                                    upg:"Lasts longer."},
      {name:"Slow and Steady",  type:"P",        tier:"B",desc:"Moving slowly gives you defensive bonuses.",                                          upg:"Higher bonus."},
      {name:"Slack Off",        type:"P",        tier:"C",desc:"Not taking actions gives a minor benefit.",                                           upg:"Unknown."},
      {name:"Toad Style",       type:"P",        tier:"B",desc:"+4 SPD. Movement becomes Jump. Landing on a unit damages and displaces it.",          upg:"Higher SPD or bigger landing dmg."},
      {name:"Stoic",            type:"P",        tier:"B",desc:"Ignore debuffs for a brief period each battle.",                                      upg:"Longer immunity window."},
      {name:"My Leg!",          type:"P",        tier:"C",desc:"Take bonus damage but gain a huge counter-benefit.",                                  upg:"Unknown."},
    ],
  },

  Necromancer: {
    icon:"💀", role:"Corpse Controller · Soul Link Abuser",
    combos:["Soul Link + Spread Sorrow (chain same damage to all linked enemies)","Reanimate + Medic cleanse (Zombie → permanent ally)","Eternal Servitude on elite enemies (steal their power)","Shriek + Spread Sorrow (debuff entire board in one cast)"],
    abilities:[
      // ── ACTIVES (59 total) ──
      {name:"Soul Link",          type:"A",mp:6,  tier:"S",desc:"Inflict Soul Link on units in an area — damage one, all linked take it.",           upg:"More units linked or longer duration."},
      {name:"Eternal Servitude",  type:"A",mp:12, tier:"S",desc:"Resurrect a body at full HP as a permanent ally.",                                   upg:"Reduced mana cost."},
      {name:"Reanimate",          type:"A",mp:5,  tier:"A",desc:"Resurrect a body to 50% HP as a Zombie ally.",                                      upg:"Higher HP or no Zombie debuff."},
      {name:"Shriek",             type:"A",mp:9,  tier:"A",desc:"Inflict Fear 1, Confusion 2, and Madness 2 on all units in a cone.",                upg:"Wider cone or stronger debuffs."},
      {name:"Reaper Step",        type:"A",mp:6,  tier:"A",desc:"Teleport to an open tile in range 1. Gains +1 range each time a unit dies.",        upg:"Starts with higher base range."},
      {name:"Rebirth",            type:"A",mp:5,  tier:"A",desc:"Resurrect yourself or an ally to a weak state.",                                    upg:"Higher HP on rebirth."},
      {name:"Pestilence",         type:"A",mp:4,  tier:"A",desc:"Inflict a disease on an enemy that spreads to adjacent units.",                     upg:"Faster spread or higher stacks."},
      {name:"Summon Shade",       type:"A",mp:13, tier:"A",desc:"Summon a powerful shade familiar to fight alongside you.",                           upg:"Shade starts buffed."},
      {name:"Summon Bones",       type:"A",mp:6,  tier:"A",desc:"Summon a bone construct familiar.",                                                  upg:"Stronger bone construct."},
      {name:"Flesh Golem",        type:"A",mp:0,  tier:"A",desc:"Assemble a flesh golem from nearby corpses.",                                        upg:"Golem has more HP."},
      {name:"Unearth",            type:"A",mp:5,  tier:"A",desc:"Unearth corpses from the ground as zombie units.",                                   upg:"More corpses unearthed."},
      {name:"Death Bloom",        type:"A",mp:0,  tier:"A",desc:"When a unit dies nearby, spawn food. Core Fly Swarm piece.",                        upg:"More food spawned."},
      {name:"Decompose",          type:"A",mp:5,  tier:"A",desc:"Rapidly decompose a corpse to spawn resources.",                                     upg:"More resources spawned."},
      {name:"Dark Ritual",        type:"A",mp:2,  tier:"A",desc:"Cheap ritual granting power at a minor cost.",                                       upg:"Better power-to-cost ratio."},
      {name:"Scare",              type:"A",mp:6,  tier:"A",desc:"Inflict Fear on units in an area.",                                                  upg:"Wider area or longer Fear."},
      {name:"Weakness",           type:"A",mp:5,  tier:"A",desc:"Inflict Weakness on a unit — reduces their damage output.",                         upg:"Stronger weakness or longer duration."},
      {name:"Seance",             type:"A",mp:6,  tier:"A",desc:"Communicate with or empower a corpse.",                                              upg:"Stronger corpse interaction."},
      {name:"Dark Step",          type:"A",mp:4,  tier:"B",desc:"Short-range dark teleport.",                                                          upg:"Longer range."},
      {name:"Leeches",            type:"A",mp:3,  tier:"B",desc:"Inflict Leech 1 on a unit. Can stack infinite times on bosses.",                    upg:"Leech 2 or AoE application."},
      {name:"Blood Rain",         type:"A",mp:3,  tier:"B",desc:"Rain blood in an area — cheap AoE damage.",                                         upg:"Wider rain area."},
      {name:"Full Moon",          type:"A",mp:3,  tier:"B",desc:"Activate moon-based bonus effects.",                                                 upg:"Stronger moon effect."},
      {name:"Replace",            type:"A",mp:3,  tier:"B",desc:"Swap a corpse with a living unit's position.",                                       upg:"Unknown."},
      {name:"Flatline",           type:"A",mp:3,  tier:"B",desc:"Briefly flatline to avoid damage or death.",                                         upg:"Longer flatline window."},
      {name:"Go Limp",            type:"A",mp:4,  tier:"B",desc:"Play dead to avoid targeting.",                                                      upg:"Longer limp duration."},
      {name:"Hush",               type:"A",mp:6,  tier:"B",desc:"Silence an enemy — prevent them from using abilities.",                              upg:"Longer silence."},
      {name:"Curse",              type:"A",mp:6,  tier:"B",desc:"Apply a powerful multi-debuff curse.",                                               upg:"More debuffs applied."},
      {name:"Soul Transfer",      type:"A",mp:1,  tier:"B",desc:"Transfer your soul to another body temporarily.",                                    upg:"Unknown."},
      {name:"Whisper",            type:"A",mp:5,  tier:"B",desc:"Secretly debuff an enemy.",                                                          upg:"Stronger whisper effect."},
      {name:"Slit Wrists",        type:"A",mp:1,  tier:"B",desc:"Intentionally damage yourself for a benefit.",                                       upg:"Better benefit."},
      {name:"Seppuku",            type:"A",mp:5,  tier:"B",desc:"Down yourself intentionally. Martyr build activator.",                               upg:"Unknown."},
      {name:"Donate Blood",       type:"A",mp:6,  tier:"B",desc:"Donate HP to an ally, healing them significantly.",                                  upg:"Better HP transfer ratio."},
      {name:"Bloodletting",       type:"A",mp:8,  tier:"B",desc:"Mass blood drain affecting multiple enemies.",                                       upg:"Wider drain area."},
      {name:"Blood Geyser",       type:"A",mp:6,  tier:"B",desc:"Explode blood from a corpse damaging nearby units.",                                 upg:"Larger geyser."},
      {name:"Lifedrain",          type:"A",mp:6,  tier:"B",desc:"Drain HP from a unit to heal yourself.",                                             upg:"More HP drained."},
      {name:"Giga Drain",         type:"A",mp:0,  tier:"B",desc:"Massive HP drain from one target.",                                                  upg:"Unknown."},
      {name:"Feed",               type:"A",mp:2,  tier:"B",desc:"Force a unit to feed on a corpse, healing them.",                                    upg:"Unknown."},
      {name:"Trade Life",         type:"A",mp:5,  tier:"B",desc:"Swap HP values with a target unit.",                                                  upg:"Unknown."},
      {name:"Coffin Flop",        type:"A",mp:6,  tier:"B",desc:"Flop a coffin/corpse at an enemy for impact damage.",                               upg:"Higher impact dmg."},
      {name:"Carrion Shot",       type:"A",mp:6,  tier:"B",desc:"Fire a shot made of carrion at an enemy.",                                           upg:"Adds disease on hit."},
      {name:"Clew of Leeches",    type:"A",mp:8,  tier:"B",desc:"Release a massive swarm of leeches in an area.",                                    upg:"More leeches."},
      {name:"Leech Shot",         type:"A",mp:0,  tier:"B",desc:"Basic attack that applies Leeches.",                                                 upg:"Unknown."},
      {name:"Leech Swarm",        type:"A",mp:12, tier:"B",desc:"Summon a leech swarm familiar.",                                                     upg:"Bigger swarm."},
      {name:"Spider Egg",         type:"A",mp:3,  tier:"B",desc:"Plant a spider egg that hatches into spiders.",                                      upg:"More spiders."},
      {name:"Reap",               type:"A",mp:7,  tier:"A",desc:"Wide melee swing that reaps multiple units.",                                        upg:"Wider arc."},
      {name:"Debone",             type:"A",mp:7,  tier:"B",desc:"Extract bones from a unit, debuffing them.",                                         upg:"Stronger debone effect."},
      {name:"Demonic Pact",       type:"A",mp:10, tier:"B",desc:"Make a deal with a demon for massive power.",                                        upg:"Better pact terms."},
      {name:"Mass Psychosis",     type:"A",mp:15, tier:"B",desc:"Drive all units insane — massive chaos AoE.",                                        upg:"Wider area."},
      {name:"Absorb Soul",        type:"A",mp:0,  tier:"B",desc:"Down an ally in range 5 and steal their mana. No injury. Once/turn.",               upg:"Steal HP too."},
      {name:"Dig Up the Dead",    type:"A",mp:16, tier:"B",desc:"Excavate many corpses from the ground at once.",                                     upg:"More corpses."},
      {name:"Gravecrawl",         type:"A",mp:8,  tier:"B",desc:"Crawl through a corpse for repositioning and effects.",                              upg:"Better effects."},
      {name:"Evil Incarnate",     type:"A",mp:15, tier:"C",desc:"Massive power surge — extreme self-buff at huge cost.",                              upg:"Slightly lower cost."},
      {name:"We Are One",         type:"A",mp:15, tier:"C",desc:"Merge all linked units into one powerful entity temporarily.",                        upg:"Unknown."},
      {name:"Forbidden Famine",   type:"A",mp:0,  tier:"C",desc:"Forbidden dark spell with extreme effects.",                                         upg:"Unknown."},
      // ── PASSIVES (25 total) ──
      {name:"Spread Sorrow",      type:"P",       tier:"S",desc:"When you inflict a debuff, inflict the same debuff on another random enemy.",        upg:"Chains to 2 enemies."},
      {name:"Immortal Leeches",   type:"P",       tier:"A",desc:"When a unit with your Leeches dies, your next basic attack inflicts that many extra Leeches.",upg:"Stronger Leech transfer."},
      {name:"Vampirism",          type:"P",       tier:"A",desc:"Heal HP from every attack and ability that deals damage.",                            upg:"Higher lifesteal%."},
      {name:"Worm Lord",          type:"P",       tier:"A",desc:"Command worms — bonus effects from parasite-type units.",                             upg:"Stronger command."},
      {name:"Cambion Conception", type:"P",       tier:"B",desc:"Gain a dark rebirth if you die — with reduced penalties.",                            upg:"Better rebirth state."},
      {name:"Sacrificial Lamb",   type:"P",       tier:"B",desc:"When downed, no injuries — just Jinxed. Martyr enabler.",                            upg:"No Jinxed either."},
      {name:"Eternal Health",     type:"P",       tier:"B",desc:"When downed, only suffer Jinxed (not injuries).",                                    upg:"Upgrade to Sacrificial Lamb effect."},
      {name:"Infinite Rebirth",   type:"P",       tier:"B",desc:"Automatically revive after being downed (once per battle).",                         upg:"Twice per battle."},
      {name:"Leech Mother",       type:"P",       tier:"B",desc:"Your Leeches deal more damage and heal more HP.",                                     upg:"Higher scaling."},
      {name:"Numbing Leeches",    type:"P",       tier:"B",desc:"Your Leeches also slow/weaken the target.",                                          upg:"Stronger numbing."},
      {name:"Dark Priest",        type:"P",       tier:"B",desc:"No weapon at battle start: gain a temporary Soul Dagger.",                            upg:"Stronger Soul Dagger."},
      {name:"Undeath",            type:"P",       tier:"B",desc:"You become harder to permanently kill.",                                              upg:"Unknown."},
      {name:"Torpor",             type:"P",       tier:"B",desc:"Enter torpor when low HP — become immune briefly.",                                   upg:"Longer torpor."},
      {name:"Chains of Guilt",    type:"P",       tier:"B",desc:"Linked enemies take bonus damage from all sources.",                                  upg:"Higher bonus damage."},
      {name:"Soul Bond",          type:"P",       tier:"B",desc:"Bond two units so they share HP changes.",                                            upg:"Bond works with more unit types."},
      {name:"Superstition",       type:"P",       tier:"B",desc:"Gain benefits from superstitious combat actions.",                                    upg:"Better superstition bonuses."},
      {name:"Offload Pain",       type:"P",       tier:"B",desc:"Transfer a portion of damage you take to a linked enemy.",                            upg:"More damage transferred."},
      {name:"Last Grasp",         type:"P",       tier:"B",desc:"When you die, deal damage to all nearby units.",                                     upg:"Higher death explosion dmg."},
      {name:"Relentless Dead",    type:"P",       tier:"B",desc:"Your zombie minions regain HP each turn.",                                            upg:"More HP regen per turn."},
      {name:"Infected",           type:"P",       tier:"B",desc:"Your attacks spread disease/debuff to adjacent units.",                               upg:"Wider spread range."},
      {name:"Parasitic",          type:"P",       tier:"B",desc:"Gain power from your minions' combat actions.",                                       upg:"More power gained."},
      {name:"Corpse Connoisseur", type:"P",       tier:"B",desc:"Gain enhanced bonuses from manipulating corpses.",                                    upg:"Better corpse interaction."},
      {name:"Servus Mortem",      type:"P",       tier:"C",desc:"Serve death — extreme bonuses when near death yourself.",                             upg:"Unknown."},
      {name:"One With Nothing",   type:"P",       tier:"C",desc:"No weapon/item bonuses but massive stat buffs.",                                      upg:"Unknown."},
      {name:"Bed Bugs",           type:"P",       tier:"C",desc:"Infest enemies when they sleep.",                                                     upg:"Unknown."},
    ],
  },

  Butcher: {
    icon:"🪓", role:"Melee Bruiser · Food & Fly Controller",
    combos:["Duke of Flies + Incubator + Butcher+ (infinite fly loop — prevents boss spawn)","Death Bloom + Spoil + Lord of the Flies (Fly Swarm)","Chomp STR loop (eat food = gain STR/HP repeatedly)","Slice and Dice + Hog Rush for wave clear"],
    abilities:[
      // ── ACTIVES (54 total) ──
      {name:"Hog Rush",          type:"A",mp:7,  tier:"A",desc:"Dash through enemies in a line dealing damage to all hit.",                           upg:"Longer dash or more dmg."},
      {name:"Body Slam",         type:"A",mp:6,  tier:"A",desc:"Slam into an adjacent unit for heavy melee damage.",                                  upg:"AoE or knockback added."},
      {name:"Chomp",             type:"A",mp:6,  tier:"A",desc:"Eat a food item to gain STR and HP.",                                                 upg:"More STR and HP per food."},
      {name:"Butcher",           type:"A",mp:5,  tier:"A",desc:"Butcher a corpse or unit to create food items.",                                      upg:"More food spawned."},
      {name:"Slice and Dice",    type:"A",mp:9,  tier:"A",desc:"Rapid multi-hit attack with movement.",                                               upg:"More hits or longer range."},
      {name:"Shred",             type:"A",mp:12, tier:"A",desc:"Massive ripping attack dealing huge damage.",                                          upg:"Lower cost at Upgrade+."},
      {name:"Mutilate",          type:"A",mp:8,  tier:"A",desc:"Brutal attack that applies multiple debuffs.",                                         upg:"Stronger debuffs."},
      {name:"Skull Bash",        type:"A",mp:5,  tier:"A",desc:"Headbutt attack that deals heavy damage and knockback.",                              upg:"Higher knockback."},
      {name:"Spin Cleave",       type:"A",mp:0,  tier:"A",desc:"Basic spin attack hitting all adjacent units.",                                       upg:"Unknown."},
      {name:"Wide Cleave",       type:"A",mp:0,  tier:"A",desc:"Wide cleave hitting units in a broad arc.",                                           upg:"Unknown."},
      {name:"Cleave",            type:"A",mp:0,  tier:"A",desc:"Basic melee cleave hitting the target and adjacent unit.",                            upg:"Unknown."},
      {name:"Crushinator",       type:"A",mp:6,  tier:"A",desc:"Crushing blow that reduces enemy defense.",                                            upg:"More defense reduction."},
      {name:"Cannon Ball!",      type:"A",mp:4,  tier:"A",desc:"Roll into a ball and barrel through enemies.",                                        upg:"Longer roll or more dmg."},
      {name:"Grapnel",           type:"A",mp:5,  tier:"A",desc:"Grappling hook — pull a unit or yourself.",                                          upg:"Longer range."},
      {name:"Rough Toss",        type:"A",mp:6,  tier:"A",desc:"Grab and throw an adjacent unit at another.",                                         upg:"Longer throw range."},
      {name:"Smell Blood",       type:"A",mp:7,  tier:"A",desc:"Detect and rush toward the lowest-HP enemy.",                                         upg:"Bonus dmg to target."},
      {name:"Tromp",             type:"A",mp:3,  tier:"B",desc:"Stomp dealing damage to adjacent units.",                                             upg:"Wider stomp area."},
      {name:"Contaminate",       type:"A",mp:2,  tier:"B",desc:"Inflict Rot on a unit. Fly Swarm synergy: Rot → flies on death.",                   upg:"AoE Rot application."},
      {name:"Consume",           type:"A",mp:3,  tier:"B",desc:"Consume a unit or item to gain HP.",                                                  upg:"More HP per consume."},
      {name:"Force Feed",        type:"A",mp:3,  tier:"B",desc:"Force an enemy to eat food (debuff or Fly Swarm setup).",                             upg:"Works at range."},
      {name:"Burp",              type:"A",mp:5,  tier:"B",desc:"Gas cone attack that inflicts Nausea.",                                               upg:"Larger cone or higher Nausea."},
      {name:"Binge",             type:"A",mp:2,  tier:"B",desc:"Eat multiple food items at once for proportional benefits.",                          upg:"More items consumed."},
      {name:"Fartoom!",          type:"A",mp:5,  tier:"B",desc:"Explosive gas AoE attack.",                                                           upg:"Larger explosion."},
      {name:"Fire Fart",         type:"A",mp:5,  tier:"B",desc:"Flaming gas attack applying Burn in a cone.",                                         upg:"Higher Burn stacks."},
      {name:"Death Wind",        type:"A",mp:8,  tier:"B",desc:"Large wind AoE attack.",                                                              upg:"Wider area."},
      {name:"Bad Gas",           type:"A",mp:6,  tier:"B",desc:"Gas attack with lingering damaging cloud.",                                           upg:"Longer cloud duration."},
      {name:"Cough",             type:"A",mp:3,  tier:"C",desc:"Cough to inflict disease-type debuff.",                                               upg:"Unknown."},
      {name:"Grill",             type:"A",mp:2,  tier:"C",desc:"Cook adjacent food item to restore more HP.",                                         upg:"Unknown."},
      {name:"Roast",             type:"A",mp:6,  tier:"B",desc:"Fire-based cooking/attack ability.",                                                  upg:"More dmg or better food."},
      {name:"Gib",               type:"A",mp:5,  tier:"B",desc:"Explode a low-HP unit into gibs for AoE dmg.",                                       upg:"Triggers at higher HP%."},
      {name:"Sharpen",           type:"A",mp:4,  tier:"B",desc:"Sharpen your weapon to boost next attack's damage.",                                  upg:"Longer buff duration."},
      {name:"Self Harm",         type:"A",mp:2,  tier:"B",desc:"Hurt yourself to trigger self-harm benefits.",                                         upg:"Better benefit-to-cost."},
      {name:"My Turn!",          type:"A",mp:4,  tier:"B",desc:"Demand priority — gain an extra action.",                                             upg:"Better action gained."},
      {name:"Purge",             type:"A",mp:2,  tier:"B",desc:"Purge debuffs from yourself.",                                                        upg:"Removes more debuffs."},
      {name:"Swallow",           type:"A",mp:4,  tier:"B",desc:"Swallow a unit whole — temporarily remove them.",                                    upg:"Swallow for longer."},
      {name:"Monch",             type:"A",mp:5,  tier:"B",desc:"Munch an enemy, dealing dmg and potentially eating resources.",                       upg:"More resources collected."},
      {name:"SUCC",              type:"A",mp:2,  tier:"B",desc:"Suck food toward you.",                                                               upg:"Longer suction range."},
      {name:"Spoil",             type:"A",mp:6,  tier:"S",desc:"Turn food items into flies. Core Fly Swarm piece.",                                   upg:"More flies per food item."},
      {name:"Death Bloom",       type:"A",mp:0,  tier:"A",desc:"When a unit dies nearby, spawn food — Fly Swarm setup.",                             upg:"More food per death."},
      {name:"Track",             type:"A",mp:3,  tier:"B",desc:"Track an enemy — gain their position and approach bonus.",                            upg:"Longer track duration."},
      {name:"Lunch Time",        type:"A",mp:3,  tier:"B",desc:"Force a time-out to eat, healing significantly.",                                    upg:"More HP healed."},
      {name:"Tainted Offering",  type:"A",mp:4,  tier:"B",desc:"Offer tainted food to an enemy — debuffing them.",                                   upg:"Stronger taint."},
      {name:"Hook Bind",         type:"A",mp:6,  tier:"B",desc:"Bind a unit with your hook, preventing movement.",                                   upg:"Longer bind."},
      {name:"Lodge Hook",        type:"A",mp:0,  tier:"B",desc:"Embed your hook in a unit for ongoing control.",                                      upg:"Unknown."},
      {name:"Rehook",            type:"A",mp:3,  tier:"B",desc:"Reapply hook after using it.",                                                        upg:"Lower cost."},
      {name:"Reflux",            type:"A",mp:7,  tier:"B",desc:"Forceful reflux attack damaging and debuffing.",                                      upg:"Stronger debuff."},
      {name:"Regurge",           type:"A",mp:3,  tier:"B",desc:"Regurgitate stored food or items.",                                                   upg:"Unknown."},
      {name:"Lighten the Load",  type:"A",mp:2,  tier:"B",desc:"Drop items to gain movement benefits.",                                               upg:"Unknown."},
      {name:"Chonkwalk",         type:"A",mp:2,  tier:"B",desc:"Move slowly but deal damage to units you walk through.",                              upg:"Unknown."},
      {name:"Trudge",            type:"A",mp:0,  tier:"C",desc:"Slow trudge with minor benefits.",                                                     upg:"Unknown."},
      {name:"Delicious Scent",   type:"A",mp:10, tier:"B",desc:"Emanate a scent that draws all enemies toward you.",                                  upg:"Stronger lure or larger area."},
      {name:"Yawn",              type:"A",mp:5,  tier:"B",desc:"Yawn to apply Sleep to nearby units.",                                                upg:"Wider Sleep area."},
      {name:"Bowl",              type:"A",mp:0,  tier:"B",desc:"Roll like a bowling ball through enemies.",                                            upg:"Unknown."},
      {name:"Vurp",              type:"A",mp:4,  tier:"C",desc:"Disgusting vomit attack.",                                                             upg:"Unknown."},
      // ── PASSIVES (25 total) ──
      {name:"Duke of Flies",     type:"P",       tier:"S",desc:"Flies carry over between battles. Upgrade: flies gain stats each battle survived.",   upg:"Lord of the Flies: Charmed flies, +1 Dmg (+4 upgraded)."},
      {name:"Incubator",         type:"P",       tier:"S",desc:"Spawn a Rot fly whenever you heal past max HP. Core of fly loop.",                    upg:"More flies or stronger on spawn."},
      {name:"Lord of the Flies", type:"P",       tier:"A",desc:"Your flies become Charmed and gain +1 Dmg (+4 at Upgrade+).",                        upg:"Even higher bonuses."},
      {name:"Spin to Win",       type:"P",       tier:"A",desc:"Your Cleave attack pattern is upgraded and enhanced.",                                 upg:"Further Cleave upgrades."},
      {name:"Stompy!",           type:"P",       tier:"A",desc:"Moving through units damages them. Adds Cleave to Trample.",                           upg:"Higher dmg per step."},
      {name:"Glutton",           type:"P",       tier:"A",desc:"Gain more benefits from eating food.",                                                 upg:"Even more HP/STR per food."},
      {name:"Grappling Hook",    type:"P",       tier:"A",desc:"Your hook abilities have extended range and bonus effects.",                            upg:"More range or bonus dmg."},
      {name:"Supersize Me!",     type:"P",       tier:"A",desc:"Grow in size — gaining CON and STR but losing SPD.",                                 upg:"Higher CON/STR gain."},
      {name:"Never Full",        type:"P",       tier:"A",desc:"You can eat even when you would normally be full.",                                    upg:"Even more food items consumed."},
      {name:"Fresh Meat",        type:"P",       tier:"B",desc:"Gain bonus STR from recently killed enemies.",                                         upg:"Higher STR bonus."},
      {name:"Confrontational",   type:"P",       tier:"B",desc:"Gain bonus effects from being engaged in melee.",                                      upg:"Unknown."},
      {name:"Putrefy",           type:"P",       tier:"B",desc:"Your attacks cause enemies to rot/decay over time.",                                   upg:"Faster decay."},
      {name:"Masochist",         type:"P",       tier:"B",desc:"Gain STR from taking damage.",                                                          upg:"Higher STR per hit taken."},
      {name:"Indigestion",       type:"P",       tier:"B",desc:"Eating effects have AoE damage component.",                                            upg:"Larger AoE."},
      {name:"Hooked",            type:"P",       tier:"B",desc:"Enemies you've hooked take bonus damage.",                                             upg:"Higher bonus."},
      {name:"Hack",              type:"P",       tier:"B",desc:"Cleave abilities deal bonus damage.",                                                   upg:"Higher hack bonus."},
      {name:"Harpooner",         type:"P",       tier:"B",desc:"Hook attacks have longer range and more power.",                                       upg:"Even longer range."},
      {name:"Heave Hook",        type:"P",       tier:"B",desc:"Hook pulls units more forcefully.",                                                    upg:"More pull distance."},
      {name:"Loose Meat",        type:"P",       tier:"B",desc:"Food-related passive bonuses.",                                                        upg:"Better food bonuses."},
      {name:"Bowling Ball",      type:"P",       tier:"B",desc:"Your rolling attacks deal more damage.",                                               upg:"More roll damage."},
      {name:"Rankle",            type:"P",       tier:"B",desc:"Your attacks reduce enemy morale/stats.",                                              upg:"Stronger rankle."},
      {name:"Schadenfreude",     type:"P",       tier:"B",desc:"Gain pleasure (stat bonuses) from enemy suffering.",                                   upg:"More stat bonus."},
      {name:"Testy",             type:"P",       tier:"C",desc:"Become aggressive when provoked.",                                                     upg:"Unknown."},
      {name:"Barbed",            type:"P",       tier:"B",desc:"Your attacks leave barbs that cause continued damage.",                                upg:"Higher barb damage."},
      {name:"Gurgitator",        type:"P",       tier:"B",desc:"Enhanced eating/swallowing abilities.",                                                upg:"Unknown."},
    ],
  },

  Psychic: {
    icon:"🌀", role:"Gravity Controller · Board Warper (+5 starting mana)",
    combos:["Enlightened + Become Entropy (free board wipe every turn)","Gravity Pull + Gravity Blast (cluster then launch)","Full Power (triple basic attack at full mana)","Omniscience (team-wide no-miss + ignore LoS)"],
    abilities:[
      // ── ACTIVES (54 total) ──
      {name:"Become Entropy",   type:"A",mp:14, tier:"S",desc:"Vaporize all non-boss enemies on targeted tile. Boss: heavy dmg + Stun.",            upg:"Assumed: lower mana cost."},
      {name:"Gravity Pull",     type:"A",mp:3,  tier:"S",desc:"Pull all units toward a single tile within range 5.",                                  upg:"Stronger pull or larger range."},
      {name:"Gravity Blast",    type:"A",mp:6,  tier:"A",desc:"Deal 10 Knockback to all adjacent units.",                                             upg:"Higher knockback value."},
      {name:"Gravity Wave",     type:"A",mp:6,  tier:"A",desc:"Gravity wave that affects units in a wide area.",                                      upg:"Wider wave."},
      {name:"Increase Gravity", type:"A",mp:3,  tier:"A",desc:"Inflict Slow 1. At full mana: Immobilize 1 + 6 dmg.",                                 upg:"Always deals damage at Upgrade+."},
      {name:"Mega Grav",        type:"A",mp:5,  tier:"A",desc:"Massive gravity increase on a target — Immobilize + heavy dmg.",                      upg:"Wider area."},
      {name:"Suggestion",       type:"A",mp:6,  tier:"A",desc:"Make an enemy attack another enemy. They lose their turn AND do your damage.",         upg:"AoE at Upgrade+."},
      {name:"Mind Control",     type:"A",mp:15, tier:"A",desc:"Fully control an enemy for one turn.",                                                 upg:"Control for 2 turns."},
      {name:"Mind Meld",        type:"A",mp:10, tier:"A",desc:"Deep mind meld — read and manipulate the next action of a unit.",                     upg:"Manipulate 2 actions."},
      {name:"Telekinesis",      type:"A",mp:4,  tier:"A",desc:"Move a unit or object to any adjacent tile.",                                          upg:"Move further."},
      {name:"Mindblast",        type:"A",mp:5,  tier:"A",desc:"Psychic blast dealing INT-scaling damage.",                                             upg:"Higher scaling."},
      {name:"Psychic Choke",    type:"A",mp:5,  tier:"A",desc:"Choke an enemy with psychic power — damage + prevent action.",                        upg:"Longer choke."},
      {name:"Supernova",        type:"A",mp:10, tier:"A",desc:"Massive psychic explosion affecting all nearby units.",                                 upg:"Wider explosion."},
      {name:"Asteroid",         type:"A",mp:9,  tier:"A",desc:"Call an asteroid to fall on a target tile — delayed AoE.",                            upg:"Larger asteroid."},
      {name:"Shatter the Sky",  type:"A",mp:5,  tier:"A",desc:"Crack the sky for a powerful ranged psychic attack.",                                  upg:"Wider crack."},
      {name:"Cumulative Blast", type:"A",mp:6,  tier:"A",desc:"Blast that grows stronger if used multiple times.",                                    upg:"Faster accumulation."},
      {name:"Future Sight",     type:"A",mp:5,  tier:"A",desc:"Gain insight into the next enemy actions — counter more effectively.",                 upg:"Longer foresight."},
      {name:"Ancestral Recall", type:"A",mp:8,  tier:"A",desc:"Recall a past spell cast, re-using it for free.",                                     upg:"Recall up to 2 turns ago."},
      {name:"Fast Forward",     type:"A",mp:4,  tier:"A",desc:"Advance turn order — grant an ally or yourself an extra action.",                     upg:"Grant a full extra turn."},
      {name:"Flash Forward",    type:"A",mp:7,  tier:"A",desc:"Jump to a future position and act from there.",                                        upg:"Jump further."},
      {name:"Flashback",        type:"A",mp:10, tier:"A",desc:"Return to a past position and state.",                                                  upg:"Go further back."},
      {name:"Extra Turn?",      type:"A",mp:4,  tier:"A",desc:"Random chance to grant an extra turn.",                                                upg:"Higher chance."},
      {name:"Order",            type:"A",mp:8,  tier:"A",desc:"Force a unit to perform a specific action on your command.",                           upg:"More action options."},
      {name:"Mass Hysteria",    type:"A",mp:10, tier:"A",desc:"Drive all enemies insane with hysteria — AoE confusion.",                              upg:"Wider area."},
      {name:"Hallucinate",      type:"A",mp:7,  tier:"A",desc:"Make an enemy see hallucinations — cause random movement.",                            upg:"Lasts longer."},
      {name:"Reality Scramble", type:"A",mp:6,  tier:"B",desc:"Scramble reality — random repositioning of all units.",                               upg:"More control over scramble."},
      {name:"Temporal Shards",  type:"A",mp:7,  tier:"B",desc:"Launch shards that hit across time — unpredictable dmg.",                             upg:"More predictable at Upgrade+."},
      {name:"Flicker",          type:"A",mp:4,  tier:"B",desc:"Blink briefly — short-range instant teleport.",                                        upg:"Longer blink range."},
      {name:"Flip",             type:"A",mp:4,  tier:"B",desc:"Flip the position of two units.",                                                       upg:"Works at longer range."},
      {name:"Inversion",        type:"A",mp:4,  tier:"B",desc:"Invert a unit's buffs and debuffs.",                                                   upg:"Works on more effects."},
      {name:"Manifest",         type:"A",mp:6,  tier:"B",desc:"Manifest a psychic construct to fight for you.",                                       upg:"Stronger construct."},
      {name:"Glare",            type:"A",mp:7,  tier:"B",desc:"Psychic glare that Stuns targets in LoS.",                                            upg:"Wider glare arc."},
      {name:"Blinding Flash",   type:"A",mp:5,  tier:"B",desc:"Flash of light that blinds nearby enemies.",                                           upg:"Wider blind area."},
      {name:"Mass Mana Leech",  type:"A",mp:5,  tier:"B",desc:"Drain mana from all enemies in an area.",                                             upg:"More mana drained."},
      {name:"Mindcrack",        type:"A",mp:7,  tier:"B",desc:"Crack an enemy's mind — reduce their INT significantly.",                              upg:"More INT reduction."},
      {name:"Look Away",        type:"A",mp:2,  tier:"B",desc:"Force a unit to face away from you.",                                                  upg:"Works on multiple units."},
      {name:"Vacuum",           type:"A",mp:5,  tier:"B",desc:"Create a vacuum — pull everything toward a point.",                                    upg:"Wider pull range."},
      {name:"Pass",             type:"A",mp:3,  tier:"B",desc:"Pass your turn but gain a benefit.",                                                   upg:"Better benefit."},
      {name:"Slipstream",       type:"A",mp:5,  tier:"B",desc:"Ride a psychic slipstream for enhanced movement.",                                    upg:"More movement."},
      {name:"Puppet",           type:"A",mp:3,  tier:"B",desc:"Briefly puppet an adjacent unit.",                                                     upg:"Control from longer range."},
      {name:"Read Mind",        type:"A",mp:3,  tier:"B",desc:"Read an enemy's mind — gain info on their next action.",                               upg:"Read 2 turns ahead."},
      {name:"Grow Head",        type:"A",mp:3,  tier:"B",desc:"Grow your psychic head for a bonus stat effect.",                                      upg:"Bigger head bonus."},
      {name:"Chaos Swap",       type:"A",mp:2,  tier:"B",desc:"Randomly swap two units' positions.",                                                  upg:"Choose which units at Upgrade+."},
      {name:"Alter DNA",        type:"A",mp:0,  tier:"C",desc:"Alter a unit's DNA — unpredictable effect.",                                          upg:"Unknown."},
      {name:"Mimic",            type:"A",mp:7,  tier:"B",desc:"Copy the last ability used by any unit.",                                              upg:"Copy 2 turns ago."},
      {name:"Echo",             type:"A",mp:1,  tier:"B",desc:"Echo the next spell you cast for 1 mana.",                                            upg:"Better echo value."},
      {name:"Ping",             type:"A",mp:0,  tier:"B",desc:"Free ranged psychic ping — minor dmg.",                                               upg:"Unknown."},
      {name:"Psychic Pull",     type:"A",mp:0,  tier:"B",desc:"Basic ranged pull attack.",                                                             upg:"Unknown."},
      {name:"Psyflutter",       type:"A",mp:5,  tier:"B",desc:"Flutter of psychic energy — minor area effect.",                                      upg:"Unknown."},
      {name:"Snatch",           type:"A",mp:1,  tier:"B",desc:"Steal an item from an enemy for 1 mana.",                                             upg:"Steal better items."},
      {name:"Stasis",           type:"A",mp:8,  tier:"B",desc:"Freeze a unit in time — they skip their next turn.",                                  upg:"Skip 2 turns."},
      {name:"Withdraw",         type:"A",mp:5,  tier:"B",desc:"Withdraw psychic energy — heal based on INT.",                                         upg:"More HP healed."},
      {name:"Think Deep",       type:"A",mp:5,  tier:"B",desc:"Deep thinking grants a bonus effect.",                                                 upg:"Better bonus."},
      {name:"Reset",            type:"A",mp:16, tier:"C",desc:"Reset the entire battle state — extremely expensive.",                                  upg:"Lower cost."},
      // ── PASSIVES (25 total) ──
      {name:"Enlightened",      type:"P",       tier:"S",desc:"At full mana: next 3 spells free. Upgrade+: ALL spells free once/turn.",               upg:"ALL spells free at full mana once per turn."},
      {name:"Omniscience",      type:"P",       tier:"A",desc:"You and allies can't miss any target in LoS. LoS restrictions ignored.",               upg:"Unknown."},
      {name:"True Sight",       type:"P",       tier:"A",desc:"You and allies cannot miss targets in line of sight.",                                  upg:"Unknown."},
      {name:"Full Power",       type:"P",       tier:"A",desc:"At full mana: basic attack deals triple damage and +3 Knockback.",                     upg:"Even higher multiplier."},
      {name:"Braingeyser",      type:"P",       tier:"A",desc:"Your INT-scaling attacks deal much more damage.",                                       upg:"Higher INT scaling."},
      {name:"Mental Storm",     type:"P",       tier:"A",desc:"Generate a mental storm that damages all nearby enemies each turn.",                    upg:"Wider storm or more damage."},
      {name:"Antigravity",      type:"P",       tier:"B",desc:"Reduce gravity effects on yourself — better mobility.",                                 upg:"Full gravity immunity."},
      {name:"Gravity Well",     type:"P",       tier:"B",desc:"Passively pull units toward you.",                                                      upg:"Stronger pull."},
      {name:"Drag",             type:"P",       tier:"B",desc:"Units you attack get pulled toward you.",                                               upg:"More pull distance."},
      {name:"Beckon",           type:"P",       tier:"B",desc:"Passively draw enemies or allies closer.",                                              upg:"Longer beckon range."},
      {name:"Blink",            type:"P",       tier:"B",desc:"Passively dodge attacks by blinking briefly.",                                          upg:"Higher dodge chance."},
      {name:"Flourish",         type:"P",       tier:"B",desc:"Gain bonus effects after using multiple abilities in one turn.",                        upg:"Lower requirement."},
      {name:"Psy Smack",        type:"P",       tier:"B",desc:"Your basic attacks deal psychic/INT bonus damage.",                                     upg:"Higher INT scaling."},
      {name:"Wither",           type:"P",       tier:"B",desc:"Enemies near you have their stats slowly reduced.",                                     upg:"Faster wither rate."},
      {name:"Mind Tempest",     type:"P",       tier:"B",desc:"Periodically create psychic tempests around you.",                                      upg:"More frequent or stronger."},
      {name:"Power Up",         type:"P",       tier:"B",desc:"Gain power-up charges each turn for burst use.",                                        upg:"More charges gained."},
      {name:"Glow",             type:"P",       tier:"B",desc:"Emit psychic light that affects nearby units.",                                         upg:"Wider glow area."},
      {name:"Soul Shatter",     type:"P",       tier:"B",desc:"When an enemy dies near you, shatter their soul for area damage.",                     upg:"More shatter damage."},
      {name:"Reality Shatter",  type:"P",       tier:"B",desc:"Tear reality to deal passive damage.",                                                  upg:"More damage."},
      {name:"Overflow",         type:"P",       tier:"B",desc:"When mana overflows, deal damage to nearby enemies.",                                   upg:"More overflow damage."},
      {name:"Psionic Repel",    type:"P",       tier:"B",desc:"Passively knock back units that get too close.",                                        upg:"Higher knockback."},
      {name:"Mad Visage",       type:"P",       tier:"C",desc:"Your appearance drives enemies mad on contact.",                                        upg:"Unknown."},
      {name:"Eldritch Visage",  type:"P",       tier:"C",desc:"Cosmic horror appearance debuffs nearby enemies.",                                      upg:"Unknown."},
      {name:"Repressed Memories",type:"P",      tier:"C",desc:"Suppressed memories grant random bonuses.",                                            upg:"Unknown."},
      {name:"Twiddle",          type:"P",       tier:"C",desc:"Idle twiddle that does something minor.",                                               upg:"Unknown."},
    ],
  },

  Monk: {
    icon:"🥊", role:"Stance-Switcher · Double Attacker (melee + ranged per turn)",
    combos:["Running Jab + high SPD (free hit every step)","Five Point Palm Exploding Heart Technique (guaranteed kill timer)","Flow State (scaling stats per action in a turn)","Way of the Hare + Cartwheel (movement combos)"],
    abilities:[
      // ── ACTIVES (54 total) ──
      {name:"Five Point Palm Exploding Heart Technique",type:"A",mp:7,tier:"S",desc:"Mark an enemy to die at end of X turns. Guaranteed kill.",         upg:"Shorter timer at Upgrade+."},
      {name:"Hadouken",         type:"A",mp:9,  tier:"A",desc:"Classic energy projectile dealing high magic damage.",                                  upg:"Wider projectile or adds Stun."},
      {name:"Combo Throw",      type:"A",mp:6,  tier:"A",desc:"Throw that refreshes attack options through stance shifts.",                            upg:"More refreshes per use."},
      {name:"Combo Pull",       type:"A",mp:6,  tier:"A",desc:"Pull combo that repositions enemy into melee range.",                                   upg:"Larger pull range."},
      {name:"Hundred Hand Slap",type:"A",mp:15, tier:"A",desc:"Unleash a flurry of 100 slaps for massive total damage.",                              upg:"Lower cost at Upgrade+."},
      {name:"Dragon Punch",     type:"A",mp:7,  tier:"A",desc:"Rising uppercut with knockup and high damage.",                                         upg:"Higher knockup or dmg."},
      {name:"Kamehameha",       type:"A",mp:0,  tier:"A",desc:"Charge and fire a powerful energy beam.",                                              upg:"Wider beam."},
      {name:"Unbridled Hits",   type:"A",mp:5,  tier:"A",desc:"Remove all attack limits — attack as many times as possible.",                        upg:"Better unlimited window."},
      {name:"One Punch",        type:"A",mp:0,  tier:"A",desc:"One powerful punch that can one-shot if conditions are met.",                          upg:"Easier one-shot condition."},
      {name:"Double Dragon",    type:"A",mp:5,  tier:"A",desc:"Two powerful energy strikes in rapid succession.",                                      upg:"Three strikes at Upgrade+."},
      {name:"Way of the Hare",  type:"A",mp:9,  tier:"A",desc:"Dramatically increase movement speed and actions.",                                    upg:"Even more movement."},
      {name:"Way of the Mantis",type:"A",mp:12, tier:"A",desc:"Mantis form — enhanced blocking and counter abilities.",                               upg:"Stronger counters."},
      {name:"Way of the Owl",   type:"A",mp:13, tier:"A",desc:"Owl form — enhanced ranged attacks and vision.",                                       upg:"Further range."},
      {name:"Way of the Turtle",type:"A",mp:9,  tier:"A",desc:"Turtle form — enhanced defense at the cost of speed.",                                 upg:"Higher defense."},
      {name:"Release Energy",   type:"A",mp:12, tier:"A",desc:"Release all stored energy in a powerful explosion.",                                   upg:"Wider explosion."},
      {name:"Quick Attack",     type:"A",mp:7,  tier:"A",desc:"Very fast attack that refreshes basic attack.",                                         upg:"Refreshes both actions."},
      {name:"Pummel",           type:"A",mp:5,  tier:"A",desc:"Rapid multiple melee hits.",                                                            upg:"More hits."},
      {name:"Finisher",         type:"A",mp:6,  tier:"A",desc:"Execute attack — deals bonus damage to wounded enemies.",                              upg:"Higher execute threshold."},
      {name:"Flying Fist",      type:"A",mp:5,  tier:"A",desc:"Leaping punch that closes distance and deals damage.",                                 upg:"Longer leap range."},
      {name:"Ki Burst",         type:"A",mp:3,  tier:"A",desc:"Release a ki burst — cheap AoE energy damage.",                                        upg:"Wider burst."},
      {name:"Kinetic Charge",   type:"A",mp:3,  tier:"A",desc:"Charge up kinetic energy for next attack.",                                            upg:"Stronger charge."},
      {name:"Perfect Form",     type:"A",mp:4,  tier:"A",desc:"Enter perfect form — all attacks more effective this turn.",                           upg:"Lasts 2 turns."},
      {name:"Stone Fists",      type:"A",mp:5,  tier:"A",desc:"Harden your fists for bonus melee damage.",                                            upg:"Higher bonus or added Shield."},
      {name:"Porcupine",        type:"A",mp:5,  tier:"A",desc:"Cover yourself in spines — Thorns + counterattack effect.",                            upg:"Higher Thorns."},
      {name:"One With the Wind",type:"A",mp:6,  tier:"A",desc:"Become one with the wind — enhanced mobility and evasion.",                           upg:"Higher dodge chance."},
      {name:"Air Burst",        type:"A",mp:3,  tier:"B",desc:"Release an air burst that knocks back nearby units.",                                  upg:"Wider knockback."},
      {name:"Anneal",           type:"A",mp:3,  tier:"B",desc:"Harden yourself — gain Shield with a free first cast each turn.",                     upg:"More Shield or lower cost."},
      {name:"Bruise",           type:"A",mp:6,  tier:"B",desc:"Apply a heavy Bruise to an enemy, reducing their effectiveness.",                     upg:"Stronger Bruise."},
      {name:"Cartwheel",        type:"A",mp:4,  tier:"B",desc:"Cartwheel for repositioning and a minor bonus.",                                       upg:"Longer cartwheel."},
      {name:"Charge Fists",     type:"A",mp:3,  tier:"B",desc:"Charge your fists with energy for the next punch.",                                   upg:"Stronger charge."},
      {name:"Deep Dive",        type:"A",mp:0,  tier:"B",desc:"Dive deep into combat stance for bonuses.",                                            upg:"Unknown."},
      {name:"Donate Energy",    type:"A",mp:2,  tier:"B",desc:"Transfer ki energy to an ally.",                                                        upg:"Transfer more energy."},
      {name:"Empty Mind",       type:"A",mp:0,  tier:"B",desc:"Clear your mind for a turn — gain clarity bonuses.",                                   upg:"Better clarity."},
      {name:"Fist of Fate",     type:"A",mp:5,  tier:"B",desc:"Strike with fate-imbued fist for a random powerful effect.",                           upg:"Better RNG outcomes."},
      {name:"Hip Toss",         type:"A",mp:3,  tier:"B",desc:"Grab and throw an adjacent unit.",                                                     upg:"Longer throw."},
      {name:"Hop n' Block",     type:"A",mp:6,  tier:"B",desc:"Hop back and block simultaneously.",                                                   upg:"Better block."},
      {name:"Meditate",         type:"A",mp:8,  tier:"B",desc:"Meditate to restore mana and gain buffs.",                                             upg:"More mana restored."},
      {name:"Nirvana",          type:"A",mp:0,  tier:"B",desc:"Reach nirvana — massive self-buff at high cost.",                                      upg:"Unknown."},
      {name:"Ocular Pat Down",  type:"A",mp:7,  tier:"B",desc:"Comically thorough pat-down that debuffs enemy.",                                     upg:"Stronger debuff."},
      {name:"Pogo",             type:"A",mp:5,  tier:"B",desc:"Pogo on an enemy's head for damage and mobility.",                                     upg:"More pogo bounces."},
      {name:"Position",         type:"A",mp:3,  tier:"B",desc:"Reposition for a better fighting stance.",                                             upg:"Larger reposition."},
      {name:"Propel",           type:"A",mp:5,  tier:"A",desc:"Propel yourself across the battlefield.",                                              upg:"Farther propulsion."},
      {name:"Really Fast Run",  type:"A",mp:6,  tier:"B",desc:"Run very fast — enhanced movement.",                                                   upg:"Even faster."},
      {name:"Reverberate",      type:"A",mp:0,  tier:"B",desc:"Your attacks reverberate — hits echo for bonus dmg.",                                 upg:"Unknown."},
      {name:"Sidestep",         type:"A",mp:4,  tier:"B",desc:"Sidestep an incoming attack — dodge + counter.",                                       upg:"Better counter."},
      {name:"Slapback",         type:"A",mp:0,  tier:"B",desc:"Slap back at an attacker immediately.",                                                upg:"Unknown."},
      {name:"Summon Apprentice",type:"A",mp:9,  tier:"B",desc:"Summon a martial arts apprentice familiar.",                                           upg:"Stronger apprentice."},
      {name:"Throw Spirit Bomb",type:"A",mp:0,  tier:"B",desc:"Throw a charged spirit bomb for massive AoE dmg.",                                    upg:"Unknown."},
      {name:"Charge Spirit Bomb",type:"A",mp:0, tier:"B",desc:"Charge a spirit bomb over several turns.",                                             upg:"Unknown."},
      {name:"Transcend",        type:"A",mp:4,  tier:"B",desc:"Transcend physical limits temporarily.",                                               upg:"Longer transcendence."},
      {name:"Unimpeded Lunge",  type:"A",mp:7,  tier:"B",desc:"Lunge that passes through all obstacles.",                                             upg:"More damage on pass."},
      {name:"Warm Up Stretch",  type:"A",mp:0,  tier:"B",desc:"Stretch to gain minor bonus before combat.",                                           upg:"Better stretch bonus."},
      {name:"Lobbed Shot",      type:"A",mp:0,  tier:"B",desc:"Ranged basic attack (lobbed arc).",                                                    upg:"Unknown."},
      {name:"Melee Attack",     type:"A",mp:0,  tier:"B",desc:"Standard melee basic attack.",                                                          upg:"Unknown."},
      // ── PASSIVES (25 total) ──
      {name:"Running Jab",      type:"P",       tier:"A",desc:"Gain a free melee hit every time you use your movement action.",                       upg:"Deals more dmg per jab."},
      {name:"Flow State",       type:"P",       tier:"A",desc:"Gain scaling stat bonuses mid-turn for each action taken.",                             upg:"Faster scaling per action."},
      {name:"Mixup",            type:"P",       tier:"A",desc:"Bonus effects from alternating melee and ranged attacks.",                              upg:"More mixup bonus."},
      {name:"Monkey Style",     type:"P",       tier:"A",desc:"Gain monkey-like agility — enhanced movement and evasion.",                             upg:"More agile."},
      {name:"Turnabout",        type:"P",       tier:"A",desc:"Counter enemy attacks — deal dmg back when hit.",                                       upg:"Higher counter damage."},
      {name:"Rapid Flow",       type:"P",       tier:"A",desc:"Gain bonus actions when you successfully dodge.",                                       upg:"Easier dodge threshold."},
      {name:"Perfect Technique",type:"P",       tier:"A",desc:"All attacks deal bonus damage when executed in perfect form.",                          upg:"Higher bonus."},
      {name:"Dancing Lights",   type:"P",       tier:"B",desc:"Create dancing lights that distract enemies.",                                          upg:"More lights or stronger distraction."},
      {name:"Energy Fists",     type:"P",       tier:"B",desc:"Imbue fists with energy for bonus magic damage.",                                       upg:"Higher energy damage."},
      {name:"Jagged Edges",     type:"P",       tier:"B",desc:"Your attacks leave jagged wounds that Bleed.",                                          upg:"Higher Bleed stacks."},
      {name:"Jet Fists",        type:"P",       tier:"B",desc:"Propel fists with jet power for bonus range.",                                         upg:"More range."},
      {name:"Long Arms",        type:"P",       tier:"B",desc:"Your melee attacks reach one tile further.",                                            upg:"Another tile further."},
      {name:"Mind Breaker",     type:"P",       tier:"B",desc:"Attacks reduce enemy INT.",                                                              upg:"More INT reduction."},
      {name:"Cobra Style",      type:"P",       tier:"B",desc:"Cobra-like striking — speed and precision bonuses.",                                    upg:"Higher bonuses."},
      {name:"Brick Skin",       type:"P",       tier:"B",desc:"Your skin becomes brick-hard — passive damage reduction.",                              upg:"More reduction."},
      {name:"Harden",           type:"P",       tier:"B",desc:"Gain Shield each turn passively.",                                                      upg:"More Shield per turn."},
      {name:"Iron Skin Technique",type:"P",     tier:"B",desc:"Advanced Iron Skin — better damage reduction.",                                         upg:"Higher reduction."},
      {name:"Counter Barrage",  type:"P",       tier:"B",desc:"Counter multiple attacks in sequence.",                                                 upg:"Counter more attacks."},
      {name:"Safe Switching",   type:"P",       tier:"B",desc:"Stance switches don't leave you vulnerable.",                                           upg:"Unknown."},
      {name:"Spread the Pain",  type:"P",       tier:"B",desc:"Damage you deal spreads to nearby enemies.",                                            upg:"Wider spread."},
      {name:"Tenderize",        type:"P",       tier:"B",desc:"Your attacks make enemies take more damage.",                                            upg:"Higher vulnerability."},
      {name:"Unburdened Strikes",type:"P",      tier:"B",desc:"Empty armor slots grant bonus attack damage.",                                          upg:"Higher bonus per empty slot."},
      {name:"Unburdened Motion", type:"P",      tier:"B",desc:"Empty armor slots grant bonus movement.",                                               upg:"More movement per empty slot."},
      {name:"Unburdened Thoughts",type:"P",     tier:"B",desc:"Empty armor slots grant INT/mana bonuses.",                                            upg:"Higher INT bonus."},
      {name:"Unstoppable!",     type:"P",       tier:"A",desc:"Cannot be Stunned or CC'd while active.",                                              upg:"Longer unstoppable duration."},
    ],
  },

  Thief: {
    icon:"🗡️", role:"Speed Crit · Backstab Assassin (highest SPD in game)",
    combos:["Shadow + Assassinate + Backstabber (guaranteed instant-kill)","Stalk → guaranteed backstab setup","Sweetspot passive (higher dmg at max range)","Stealthed (free +50% dodge at battle start)"],
    abilities:[
      // ── ACTIVES (51 total) ──
      {name:"Assassinate",       type:"A",mp:8,  tier:"S",desc:"Massive damage from behind a target. The Thief's win condition.",                     upg:"Works from wider arc at Upgrade+."},
      {name:"Shadow",            type:"A",mp:4,  tier:"S",desc:"Teleport behind a unit instantly.",                                                   upg:"Can pass through obstacles."},
      {name:"Time Walk",         type:"A",mp:10, tier:"A",desc:"Manipulate time — take an extra turn entirely.",                                      upg:"2 extra turns at Upgrade+."},
      {name:"Fade",              type:"A",mp:10, tier:"A",desc:"Fade completely from sight — extended Stealth.",                                      upg:"Longer fade duration."},
      {name:"Shadow Shift",      type:"A",mp:5,  tier:"A",desc:"Shift between shadows — move and attack in one action.",                              upg:"Longer shift distance."},
      {name:"Nightshade",        type:"A",mp:7,  tier:"A",desc:"Poisonous attack with powerful Poison stacks.",                                       upg:"Higher Poison stacks."},
      {name:"Venom Barrage",     type:"A",mp:5,  tier:"A",desc:"Rapid-fire venomous shots.",                                                           upg:"More shots."},
      {name:"Nail Flurry",       type:"A",mp:10, tier:"A",desc:"Rapid barrage of many nail shots.",                                                   upg:"More nails."},
      {name:"Slice",             type:"A",mp:6,  tier:"A",desc:"Heavy melee slash dealing high damage.",                                              upg:"Wider arc."},
      {name:"Sever Artery",      type:"A",mp:4,  tier:"A",desc:"Precise cut that inflicts heavy Bleed.",                                              upg:"Higher Bleed stacks."},
      {name:"Move Again",        type:"A",mp:5,  tier:"A",desc:"Take an additional movement action this turn.",                                       upg:"Gain +1 extra action."},
      {name:"Pickpocket",        type:"A",mp:3,  tier:"A",desc:"Steal an item from an enemy on contact.",                                             upg:"Steal better-quality items."},
      {name:"Steal Time",        type:"A",mp:4,  tier:"A",desc:"Steal time from a target — reduce their actions next turn.",                          upg:"Steal more time."},
      {name:"Steal Luck",        type:"A",mp:3,  tier:"A",desc:"Steal LCK from a target.",                                                            upg:"Steal more LCK."},
      {name:"Steal Kidney",      type:"A",mp:4,  tier:"A",desc:"Steal something vital — debuff the target significantly.",                            upg:"Stronger debuff."},
      {name:"Cut Purse",         type:"A",mp:4,  tier:"A",desc:"Steal coins from a target.",                                                           upg:"Steal more coins."},
      {name:"Loot Corpse",       type:"A",mp:3,  tier:"A",desc:"Loot a defeated enemy for resources.",                                                upg:"Better loot quality."},
      {name:"Boost Backstab",    type:"A",mp:4,  tier:"A",desc:"Massively boost your next backstab damage.",                                          upg:"Higher multiplier."},
      {name:"Stalk",             type:"A",mp:3,  tier:"A",desc:"Mark your target — next attack from behind is a guaranteed backstab.",                upg:"Unknown."},
      {name:"Sneak Up",          type:"A",mp:4,  tier:"A",desc:"Approach a target unseen for a guaranteed backstab setup.",                           upg:"Wider approach arc."},
      {name:"Eagle Eye",         type:"A",mp:4,  tier:"A",desc:"Spot weaknesses — your next attack hits for guaranteed crit.",                       upg:"Lasts longer."},
      {name:"Cheat",             type:"A",mp:5,  tier:"A",desc:"Cheat the rules — manipulate combat in your favor.",                                  upg:"Better cheat."},
      {name:"Poison Gas",        type:"A",mp:4,  tier:"A",desc:"Release poison gas in an area.",                                                      upg:"Larger gas cloud."},
      {name:"Poison Nail",       type:"A",mp:3,  tier:"A",desc:"Throw a nail coated in Poison that ignores Shield.",                                  upg:"Higher Poison stacks."},
      {name:"Greedstep",         type:"A",mp:4,  tier:"A",desc:"Step quickly and collect nearby pickups while repositioning.",                        upg:"Longer step range."},
      {name:"Outskirts",         type:"A",mp:4,  tier:"B",desc:"Move to the edge of the battlefield for safer positioning.",                          upg:"Bonus at the outskirts."},
      {name:"Rebound",           type:"A",mp:3,  tier:"B",desc:"Rebound off a unit to change position.",                                              upg:"Farther rebound."},
      {name:"Backflip",          type:"A",mp:4,  tier:"B",desc:"Backflip away from danger.",                                                           upg:"Farther flip."},
      {name:"Blur",              type:"A",mp:4,  tier:"B",desc:"Move so fast you blur — gain evasion for a turn.",                                    upg:"Higher dodge chance."},
      {name:"Quick Roll",        type:"A",mp:0,  tier:"B",desc:"Quick evasive roll.",                                                                  upg:"Unknown."},
      {name:"Skin Disguise",     type:"A",mp:3,  tier:"B",desc:"Disguise yourself as another unit briefly.",                                          upg:"Better disguise."},
      {name:"Pierce",            type:"A",mp:4,  tier:"B",desc:"Attack that ignores Shield/armor.",                                                   upg:"Ignores more defense."},
      {name:"Pierce Shot",       type:"A",mp:5,  tier:"B",desc:"Ranged attack that passes through units.",                                            upg:"More pierce distance."},
      {name:"Sharp Nail",        type:"A",mp:3,  tier:"B",desc:"Throw a sharp nail for quick ranged dmg.",                                            upg:"More damage."},
      {name:"Sharpen Nail",      type:"A",mp:5,  tier:"B",desc:"Sharpen your nail for higher damage.",                                                upg:"More sharpen bonus."},
      {name:"Triple Nails",      type:"A",mp:4,  tier:"B",desc:"Throw 3 nails simultaneously.",                                                       upg:"4 nails at Upgrade+."},
      {name:"Caltrops",          type:"A",mp:4,  tier:"B",desc:"Drop caltrops that damage and Slow enemies.",                                         upg:"More caltrops or higher Slow."},
      {name:"Pocket Sand",       type:"A",mp:4,  tier:"B",desc:"Throw sand at an enemy to blind them.",                                               upg:"Longer blind duration."},
      {name:"Rearm",             type:"A",mp:7,  tier:"B",desc:"Rapidly rearm yourself for an extra attack.",                                         upg:"Multiple rearms."},
      {name:"Distract",          type:"A",mp:2,  tier:"B",desc:"Distract an enemy — they face away from you.",                                        upg:"Lasts longer."},
      {name:"Declaw",            type:"A",mp:3,  tier:"B",desc:"Remove an enemy's claws — reduce their STR.",                                         upg:"More STR reduction."},
      {name:"Jitter",            type:"A",mp:3,  tier:"B",desc:"Move erratically — confuse AI targeting.",                                            upg:"Longer jitter."},
      {name:"Lucky Penny",       type:"A",mp:1,  tier:"B",desc:"Spend 1 LCK for a bonus effect.",                                                     upg:"Better bonus."},
      {name:"Wind Up",           type:"A",mp:1,  tier:"B",desc:"Wind up for a stronger next attack.",                                                 upg:"Higher wind-up bonus."},
      {name:"Nail Throw",        type:"A",mp:0,  tier:"B",desc:"Basic ranged nail throw.",                                                             upg:"Unknown."},
      {name:"Weakening Nail",    type:"A",mp:3,  tier:"B",desc:"Nail that reduces target's DEX/SPD.",                                                 upg:"More reduction."},
      {name:"Slingshade",        type:"A",mp:6,  tier:"B",desc:"Use shadow as a slingshot for a powerful ranged attack.",                             upg:"More damage."},
      {name:"Distract",          type:"A",mp:2,  tier:"B",desc:"Distract an enemy — they skip targeting you.",                                        upg:"AoE at Upgrade+."},
      {name:"Over Here, Over There",type:"A",mp:0,tier:"B",desc:"Confuse enemy positioning — they move wrong direction.",                             upg:"Unknown."},
      {name:"Coin Toss",         type:"A",mp:0,  tier:"B",desc:"Flip a coin — 50/50 between two effects.",                                            upg:"Better both outcomes."},
      {name:"Poison Dip",        type:"A",mp:0,  tier:"B",desc:"Dip attack into poison — next hit is poisoned.",                                      upg:"Higher Poison on dip."},
      // ── PASSIVES (25 total) ──
      {name:"Backstabber",       type:"P",       tier:"S",desc:"Your backstabs are always critical hits.",                                             upg:"Backstab crits deal bonus damage."},
      {name:"Stealthed",         type:"P",       tier:"A",desc:"Start each battle with Stealth (+50% dodge). Lose Stealth when hit.",                 upg:"Harder to break Stealth."},
      {name:"Critical",          type:"P",       tier:"A",desc:"Double critical hit damage. Gain LCK on crits.",                                      upg:"Unknown."},
      {name:"Sweetspot",         type:"P",       tier:"A",desc:"+1 range. Basic attacks deal more damage the farther from your target.",               upg:"Unknown."},
      {name:"Poison Tips",       type:"P",       tier:"A",desc:"Your basic attacks inflict Poison 1.",                                                 upg:"Poison 2 at Upgrade+."},
      {name:"Razor Claws",       type:"P",       tier:"A",desc:"Your attacks deal bonus Bleed damage.",                                               upg:"Higher Bleed."},
      {name:"More!",             type:"P",       tier:"A",desc:"Gain bonus attacks/actions when you collect pickups.",                                 upg:"More bonus actions."},
      {name:"Burgle",            type:"P",       tier:"A",desc:"Enhanced stealing — steal better items and effects.",                                 upg:"Even better steals."},
      {name:"First Strike",      type:"P",       tier:"A",desc:"If you attack first in a round, deal bonus damage.",                                  upg:"Higher first-strike bonus."},
      {name:"After Image",       type:"P",       tier:"B",desc:"Leave an afterimage when hit — chance to dodge.",                                     upg:"Higher dodge chance."},
      {name:"Agile",             type:"P",       tier:"B",desc:"Gain bonus dodge chance passively.",                                                   upg:"Higher dodge."},
      {name:"Double Throw",      type:"P",       tier:"B",desc:"Throw attacks hit twice.",                                                             upg:"Three throws at Upgrade+."},
      {name:"Penetrate",         type:"P",       tier:"B",desc:"Attacks ignore a portion of enemy defense.",                                           upg:"Ignore more defense."},
      {name:"Pinpoint",          type:"P",       tier:"B",desc:"Always hit weak points for bonus damage.",                                             upg:"Higher weak point damage."},
      {name:"Shiv",              type:"P",       tier:"B",desc:"Bonus damage from small sharp weapons.",                                               upg:"More shiv damage."},
      {name:"Shank",             type:"P",       tier:"B",desc:"Bonus damage from shanking (undetected stab).",                                        upg:"Higher shank bonus."},
      {name:"Cripple",           type:"P",       tier:"B",desc:"Attacks reduce enemy SPD.",                                                            upg:"More SPD reduction."},
      {name:"Golden Claws",      type:"P",       tier:"B",desc:"Attacks have a chance to steal coins.",                                               upg:"More coins per steal."},
      {name:"Swift Looter",      type:"P",       tier:"B",desc:"Loot actions are faster — can loot as free action.",                                  upg:"Collect multiple items at once."},
      {name:"Loot Hoarder",      type:"P",       tier:"B",desc:"Gain bonus effects based on how many items you carry.",                               upg:"Higher bonus per item."},
      {name:"Bounty Hunter",     type:"P",       tier:"B",desc:"Gain extra rewards for killing high-value targets.",                                   upg:"Better bounties."},
      {name:"Flip a Coin",       type:"P",       tier:"C",desc:"Random 50/50 passive effects.",                                                        upg:"Better 50/50 outcomes."},
      {name:"Weak Spot",         type:"P",       tier:"B",desc:"Identify and always target weak spots.",                                              upg:"Higher weak spot bonus."},
      {name:"ZIP!",              type:"P",       tier:"A",desc:"Move at incredible speed — enhanced movement.",                                         upg:"Even faster."},
      {name:"Shake Down",        type:"P",       tier:"B",desc:"Extract coins and items from enemies you defeat.",                                     upg:"Better extraction."},
    ],
  },

  Druid: {
    icon:"🌿", role:"Summoner · Elemental & Animal Controller (starts with Crow companion)",
    combos:["Brood Mother + many familiars + Battle Cry (buff entire swarm)","Inspirational Song + party buff stack","Entangle + ranged allies (hard CC + free damage)","Summon Bear + promote for elite familiar"],
    abilities:[
      // ── ACTIVES (75 total) ──
      {name:"Battle Cry",          type:"A",mp:8,  tier:"A",desc:"Buff all allied units and familiars.",                                              upg:"Stronger buffs."},
      {name:"Entangle",            type:"A",mp:5,  tier:"A",desc:"Immobilize enemies with plants. Hard CC.",                                          upg:"Longer immobilize or AoE."},
      {name:"Inspirational Song",  type:"A",mp:4,  tier:"A",desc:"Sing an inspiring song buffing all allies with stat boosts.",                       upg:"Stronger inspiration."},
      {name:"Summon Bear",         type:"A",mp:12, tier:"A",desc:"Summon a powerful bear familiar.",                                                  upg:"Bear starts with higher HP/dmg."},
      {name:"Summon Squirrel",     type:"A",mp:6,  tier:"B",desc:"Summon a squirrel familiar.",                                                       upg:"Squirrel starts buffed."},
      {name:"Summon Snake",        type:"A",mp:6,  tier:"B",desc:"Summon a poison snake familiar.",                                                   upg:"More Poison stacks."},
      {name:"Summon Toad",         type:"A",mp:6,  tier:"B",desc:"Summon a toad familiar.",                                                           upg:"Toad starts buffed."},
      {name:"Summon Turtle",       type:"A",mp:6,  tier:"B",desc:"Summon a defensive turtle familiar.",                                               upg:"Higher turtle armor."},
      {name:"Squirrel Squad",      type:"A",mp:13, tier:"A",desc:"Summon a large squad of squirrels.",                                                upg:"More squirrels."},
      {name:"Cheerlead",           type:"A",mp:10, tier:"A",desc:"Major buff to all allied units.",                                                   upg:"Stronger buff."},
      {name:"Encourage",           type:"A",mp:8,  tier:"A",desc:"Targeted significant buff to an ally.",                                             upg:"Stronger buff."},
      {name:"War Cry",             type:"A",mp:5,  tier:"A",desc:"War cry that buffs offensive stats.",                                               upg:"Stronger offensive buff."},
      {name:"Nature's Blessing",   type:"A",mp:9,  tier:"A",desc:"Blessed by nature — party-wide HP regen and buffs.",                               upg:"Stronger blessing."},
      {name:"We Are the Champions",type:"A",mp:7,  tier:"A",desc:"Party becomes champions — massive team buff.",                                      upg:"Stronger championship."},
      {name:"Grant Life",          type:"A",mp:2,  tier:"A",desc:"Grant life energy to a unit — heal and minor buff.",                                upg:"More life granted."},
      {name:"Protect",             type:"A",mp:5,  tier:"A",desc:"Shield an ally from the next hit.",                                                 upg:"Absorbs more dmg."},
      {name:"Promote",             type:"A",mp:5,  tier:"A",desc:"Promote a familiar to be stronger.",                                                upg:"Bigger promotion bonus."},
      {name:"Stand By Me",         type:"A",mp:4,  tier:"A",desc:"Have a familiar stand by and protect an ally.",                                     upg:"Stronger protection."},
      {name:"Step In",             type:"A",mp:3,  tier:"B",desc:"Step in front of an ally to intercept an attack.",                                  upg:"Unknown."},
      {name:"Safety Dance",        type:"A",mp:5,  tier:"B",desc:"Dance that makes allies dodge better.",                                             upg:"Higher dodge chance."},
      {name:"Bestow Wisdom",       type:"A",mp:3,  tier:"A",desc:"Grant an ally +INT for better mana economy.",                                       upg:"More INT granted."},
      {name:"Song of Spring",      type:"A",mp:7,  tier:"A",desc:"Spring song that heals and buffs the party.",                                       upg:"Higher heal + buff."},
      {name:"Lullaby",             type:"A",mp:12, tier:"A",desc:"Lullaby that puts all nearby enemies to Sleep.",                                    upg:"Wider Sleep area."},
      {name:"Sleep Powder",        type:"A",mp:7,  tier:"A",desc:"Release sleep powder in an area.",                                                  upg:"Larger area."},
      {name:"Mock Song",           type:"A",mp:0,  tier:"B",desc:"Mock enemies with a song — reduce their morale.",                                   upg:"Unknown."},
      {name:"Serenade",            type:"A",mp:5,  tier:"B",desc:"Serenade to charm a target.",                                                       upg:"Stronger charm."},
      {name:"Tease",               type:"A",mp:4,  tier:"B",desc:"Tease an enemy — distract them.",                                                   upg:"Longer distraction."},
      {name:"Death Metal",         type:"A",mp:13, tier:"B",desc:"Blast death metal music — powerful AoE damage.",                                    upg:"Lower cost or larger AoE."},
      {name:"We Will Rock You",    type:"A",mp:4,  tier:"B",desc:"Rock song that applies a buff to allies.",                                          upg:"Stronger rock buff."},
      {name:"Call the Wind",       type:"A",mp:4,  tier:"B",desc:"Call the wind — knockback or movement effect.",                                     upg:"Stronger wind."},
      {name:"Hydro Pump",          type:"A",mp:4,  tier:"B",desc:"Water pump attack.",                                                                 upg:"Wider stream."},
      {name:"Control Air",         type:"A",mp:4,  tier:"B",desc:"Control air — knockback or positioning effects.",                                   upg:"More control."},
      {name:"Control Water",       type:"A",mp:4,  tier:"B",desc:"Control water — create puddles or sweep units.",                                    upg:"More control."},
      {name:"Control Plants",      type:"A",mp:4,  tier:"B",desc:"Control plant tiles on the battlefield.",                                           upg:"More plant tiles controlled."},
      {name:"Bloom",               type:"A",mp:6,  tier:"B",desc:"AoE mana explosion — magic AoE damage.",                                            upg:"Wider AoE."},
      {name:"Bramble Burst",       type:"A",mp:5,  tier:"B",desc:"Burst of Brambles AoE that damages and slows.",                                    upg:"Larger burst."},
      {name:"Flower Feet",         type:"A",mp:6,  tier:"B",desc:"Flowers appear under your feet — Thorns + heal.",                                  upg:"More Thorns/heal."},
      {name:"Thorny Feet",         type:"A",mp:6,  tier:"B",desc:"Thorny feet that damage enemies you step on.",                                      upg:"Higher Thorns."},
      {name:"Cha Cha Slide",       type:"A",mp:5,  tier:"B",desc:"Dance for positioning and a minor buff.",                                           upg:"Better positioning."},
      {name:"Bear Swipes",         type:"A",mp:0,  tier:"A",desc:"Bear form powerful cleave attack.",                                                  upg:"Wider cleave."},
      {name:"Antler Swipe",        type:"A",mp:0,  tier:"B",desc:"Elk form antler attack.",                                                            upg:"Unknown."},
      {name:"Feral Attack",        type:"A",mp:0,  tier:"B",desc:"Wild feral melee attack.",                                                           upg:"Unknown."},
      {name:"Pounce",              type:"A",mp:6,  tier:"B",desc:"Pounce on a target for a gap-closing attack.",                                      upg:"More damage on pounce."},
      {name:"Head Bash",           type:"A",mp:0,  tier:"B",desc:"Bash with head for AoE damage.",                                                    upg:"Unknown."},
      {name:"Harden Shell",        type:"A",mp:6,  tier:"B",desc:"Harden your shell — gain high defense.",                                            upg:"Higher defense."},
      {name:"Form of the Monkey",  type:"A",mp:0,  tier:"A",desc:"Transform into monkey form — enhanced mobility.",                                   upg:"Better monkey abilities."},
      {name:"Form of the Wolf",    type:"A",mp:0,  tier:"A",desc:"Transform into wolf form — enhanced speed and attack.",                             upg:"Higher wolf bonuses."},
      {name:"Form of the Turtle",  type:"A",mp:0,  tier:"B",desc:"Transform into turtle form — enhanced defense.",                                    upg:"Higher turtle defense."},
      {name:"Form of the Elk",     type:"A",mp:0,  tier:"B",desc:"Transform into elk form — knockback resistance + charge.",                          upg:"Unknown."},
      {name:"Form of the Raccoon", type:"A",mp:0,  tier:"B",desc:"Transform into raccoon form — enhanced looting/agility.",                           upg:"Unknown."},
      {name:"Form of the Mockingbird",type:"A",mp:0,tier:"B",desc:"Transform into mockingbird — mimic abilities.",                                   upg:"Unknown."},
      {name:"Form of the Squirrel",type:"A",mp:10, tier:"B",desc:"Transform into squirrel form — enhanced speed.",                                    upg:"Unknown."},
      {name:"Form of the Tree",    type:"A",mp:0,  tier:"B",desc:"Transform into a tree — rooted but massive defense/regen.",                         upg:"Unknown."},
      {name:"Aeroblast",           type:"A",mp:5,  tier:"B",desc:"Wind blast dealing 1 dmg and knockback in a line.",                                 upg:"More dmg or range."},
      {name:"Flutter",             type:"A",mp:5,  tier:"B",desc:"Crow flutter — dash/wing attack.",                                                  upg:"Unknown."},
      {name:"Resummon Crow",       type:"A",mp:11, tier:"B",desc:"Resummon your crow companion if it falls.",                                         upg:"Crow has more HP on resummon."},
      {name:"Summon Caterpillar",  type:"A",mp:6,  tier:"B",desc:"Summon a caterpillar familiar that can metamorphose.",                              upg:"Better metamorphosis."},
      {name:"Monkey Toss",         type:"A",mp:6,  tier:"B",desc:"Toss a monkey (or self) at a target.",                                              upg:"More dmg."},
      {name:"From the Trees!",     type:"A",mp:8,  tier:"B",desc:"Ambush from above — high dmg surprise attack.",                                    upg:"More dmg."},
      {name:"Scavenge",            type:"A",mp:4,  tier:"B",desc:"Scavenge for resources on the battlefield.",                                         upg:"Better scavenge."},
      {name:"Pilfer",              type:"A",mp:0,  tier:"B",desc:"Steal resources in raccoon form.",                                                   upg:"Unknown."},
      {name:"Prance",              type:"A",mp:3,  tier:"B",desc:"Prance for a movement bonus.",                                                       upg:"Unknown."},
      {name:"Windy Step",          type:"A",mp:4,  tier:"B",desc:"Step on wind for enhanced movement.",                                               upg:"Unknown."},
      {name:"Birth Squirrel",      type:"A",mp:2,  tier:"B",desc:"Spawn a single squirrel familiar. Cheap fodder.",                                   upg:"Unknown."},
      {name:"Plant Mushroom",      type:"A",mp:6,  tier:"B",desc:"Plant a mushroom that has effects when enemies step on it.",                        upg:"Stronger mushroom effect."},
      {name:"Throw Egg",           type:"A",mp:7,  tier:"B",desc:"Throw an egg at an enemy — hatches on impact.",                                    upg:"What hatches is stronger."},
      {name:"Throw Poop",          type:"A",mp:0,  tier:"C",desc:"Throw poop at an enemy for a minor debuff.",                                        upg:"Unknown."},
      {name:"Self-destruct",       type:"A",mp:0,  tier:"C",desc:"Explode in a dramatic self-destruct.",                                              upg:"Unknown."},
      {name:"Chitter",             type:"A",mp:0,  tier:"B",desc:"Squirrel form chitter for a minor effect.",                                         upg:"Unknown."},
      {name:"Synthesize",          type:"A",mp:3,  tier:"B",desc:"Synthesize elements for a bonus effect.",                                           upg:"Better synthesis."},
      {name:"Wolf Claws",          type:"A",mp:0,  tier:"A",desc:"Wolf form: 2-hit melee attack.",                                                    upg:"Unknown."},
      {name:"Sing",                type:"A",mp:0,  tier:"A",desc:"Basic crow sing — charm or buff effect.",                                           upg:"Unknown."},
      {name:"Timber",              type:"A",mp:0,  tier:"B",desc:"Tree form: fall on nearby units.",                                                  upg:"Unknown."},
      {name:"Squirrel Swipes",     type:"A",mp:0,  tier:"B",desc:"Squirrel form: multi-hit quick swipes.",                                            upg:"Unknown."},
      // ── PASSIVES (25 total) ──
      {name:"Brood Mother",        type:"P",       tier:"S",desc:"Your familiars and Charmed units gain +2 Damage and +5 HP.",                        upg:"Higher bonuses."},
      {name:"Super Crow!",         type:"P",       tier:"A",desc:"Your crow companion is significantly enhanced.",                                     upg:"Even stronger crow."},
      {name:"Mega Minions",        type:"P",       tier:"A",desc:"All your summoned minions are larger and more powerful.",                            upg:"Higher power bonus."},
      {name:"Wild Animals",        type:"P",       tier:"A",desc:"Summoned animals start with enhanced stats.",                                        upg:"Higher starting stats."},
      {name:"Teamwork",            type:"P",       tier:"A",desc:"Bonus effects when allies attack the same target.",                                  upg:"Higher teamwork bonus."},
      {name:"Super Friends",       type:"P",       tier:"A",desc:"Familiars and allies gain bonus effects from proximity.",                            upg:"Larger proximity range."},
      {name:"Encore",              type:"P",       tier:"A",desc:"Song abilities play twice for double effect.",                                       upg:"Even stronger encore."},
      {name:"Buddy System",        type:"P",       tier:"A",desc:"Pairs of units gain bonuses.",                                                       upg:"Higher pair bonus."},
      {name:"Nature's Guidance",   type:"P",       tier:"A",desc:"Passive guidance — bonus pathfinding and positioning.",                              upg:"Unknown."},
      {name:"Pathfinder",          type:"P",       tier:"B",desc:"Ignore terrain penalties.",                                                          upg:"Additional terrain bonuses."},
      {name:"Poison Ivy",          type:"P",       tier:"B",desc:"Passive Poison on contact.",                                                         upg:"Higher Poison stacks."},
      {name:"Bark Skin",           type:"P",       tier:"B",desc:"Passive damage reduction from natural bark.",                                        upg:"More reduction."},
      {name:"Flower Power",        type:"P",       tier:"B",desc:"Gain power from flowers on the battlefield.",                                       upg:"More power per flower."},
      {name:"Good Vibrations",     type:"P",       tier:"B",desc:"Positive vibes — minor party buff.",                                                 upg:"Stronger vibes."},
      {name:"Bouquet",             type:"P",       tier:"B",desc:"Flowers grant bonus effects.",                                                       upg:"Better bouquet."},
      {name:"Like a Fish",         type:"P",       tier:"B",desc:"Enhanced water tile movement.",                                                      upg:"More water bonuses."},
      {name:"Love Song",           type:"P",       tier:"B",desc:"Charm nearby units with your love song.",                                            upg:"Wider charm range."},
      {name:"Maestro",             type:"P",       tier:"B",desc:"Song abilities are enhanced.",                                                       upg:"Stronger songs."},
      {name:"Rap God",             type:"P",       tier:"B",desc:"Rapid-fire song effects.",                                                           upg:"Unknown."},
      {name:"Versatile Vocalist",  type:"P",       tier:"B",desc:"Your voice has multiple elemental effects.",                                         upg:"More elements."},
      {name:"Animalistic",         type:"P",       tier:"B",desc:"Gain animal form bonuses more easily.",                                              upg:"Easier form switching."},
      {name:"Feral",               type:"P",       tier:"B",desc:"In feral form, deal bonus damage.",                                                  upg:"More feral bonus."},
      {name:"Wild Style",          type:"P",       tier:"B",desc:"Unpredictable wild attacks.",                                                        upg:"Unknown."},
      {name:"Sneak Attack",        type:"P",       tier:"B",desc:"First attack on a unit is a guaranteed backstab.",                                   upg:"More sneak attack uses."},
      {name:"Suicide Squad",       type:"P",       tier:"C",desc:"Your familiars explode on death.",                                                   upg:"Bigger explosion."},
      {name:"Empty Vessels",       type:"P",       tier:"C",desc:"Familiars are sacrificed for a power boost.",                                        upg:"Unknown."},
    ],
  },

  Tinkerer: {
    icon:"⚙️", role:"Gadget Crafter · High Variance (C-tier without Duct Tape; strong with it)",
    combos:["Duct Tape (keep weapons between fights — MANDATORY)","Research + ally skill use synergy (+dmg magic combo)","Mech Suit + IT'S ALIVE! passive","Build Turret + Build Nuke for battle setup"],
    abilities:[
      // ── ACTIVES (54 total) ──
      {name:"Craft Weapon",          type:"A",mp:0,  tier:"S",desc:"Craft a random weapon. Core class mechanic. Quality scales with Tech level.",   upg:"Higher tier weapons at Upgrade+."},
      {name:"Research",              type:"A",mp:5,  tier:"A",desc:"Increase Tech level — improves all crafted weapon quality.",                     upg:"Faster Tech scaling."},
      {name:"Mech Suit",             type:"A",mp:15, tier:"A",desc:"Summon a powerful robotic Mech Suit — massive ally.",                            upg:"Stronger Mech stats."},
      {name:"Build Turret",          type:"A",mp:8,  tier:"A",desc:"Build a stationary turret that auto-attacks enemies.",                           upg:"Stronger turret or faster fire."},
      {name:"Build Nuke",            type:"A",mp:9,  tier:"A",desc:"Build a tactical nuke that detonates for massive AoE damage.",                   upg:"Larger explosion."},
      {name:"Catbot",                type:"A",mp:8,  tier:"A",desc:"Spawn a catbot familiar — AI-controlled robot ally.",                            upg:"Catbot starts with more HP/dmg."},
      {name:"Nurse Bot",             type:"A",mp:9,  tier:"A",desc:"Spawn a nurse bot that heals allies.",                                            upg:"Stronger healing bot."},
      {name:"Punchbot",              type:"A",mp:6,  tier:"A",desc:"Spawn a punchbot that attacks enemies.",                                          upg:"Stronger punchbot."},
      {name:"Robo-Vac",              type:"A",mp:4,  tier:"A",desc:"Deploy a robo-vac that collects pickups.",                                       upg:"Faster and more collection."},
      {name:"Throw Weapon",          type:"A",mp:0,  tier:"A",desc:"Throw your crafted weapon at an enemy.",                                          upg:"Unknown."},
      {name:"Craft",                 type:"A",mp:4,  tier:"A",desc:"General crafting action for various gadgets.",                                    upg:"Better crafted items."},
      {name:"Upgrade",               type:"A",mp:4,  tier:"A",desc:"Upgrade an existing weapon or gadget.",                                           upg:"Better upgrade outcome."},
      {name:"Improve",               type:"A",mp:2,  tier:"A",desc:"Minor improvement to a weapon or gadget.",                                        upg:"More improvement."},
      {name:"Fabricate",             type:"A",mp:5,  tier:"A",desc:"Fabricate materials from thin air.",                                              upg:"Better fabricated items."},
      {name:"Repair",                type:"A",mp:5,  tier:"A",desc:"Repair a weapon or gadget to restore its uses.",                                  upg:"Restore more uses."},
      {name:"Repair Armor",          type:"A",mp:5,  tier:"A",desc:"Repair armor to restore defense.",                                               upg:"More defense restored."},
      {name:"Armor Up",              type:"A",mp:5,  tier:"A",desc:"Equip additional armor for temporary defense.",                                   upg:"Higher defense gain."},
      {name:"Fast Hands",            type:"A",mp:8,  tier:"A",desc:"Rapidly use your weapon for an extra attack.",                                   upg:"More extra attacks."},
      {name:"Eureka!",               type:"A",mp:5,  tier:"A",desc:"Moment of inspiration — craft or create something special.",                     upg:"Better eureka outcomes."},
      {name:"Instant Barrier",       type:"A",mp:1,  tier:"A",desc:"Instantly deploy a barrier for 1 mana — low cost Shield.",                      upg:"Higher Shield value."},
      {name:"Spare Parts",           type:"A",mp:1,  tier:"B",desc:"Produce spare parts for future gadgets.",                                         upg:"Better parts quality."},
      {name:"Refine Materials",      type:"A",mp:1,  tier:"B",desc:"Refine raw materials for stronger crafting.",                                     upg:"Better refinement."},
      {name:"Recycle",               type:"A",mp:5,  tier:"B",desc:"Recycle a weapon or item for resources.",                                         upg:"More resources."},
      {name:"Discharge",             type:"A",mp:0,  tier:"B",desc:"Discharge built-up electricity for AoE damage.",                                 upg:"Higher charge."},
      {name:"Electric Nail",         type:"A",mp:5,  tier:"B",desc:"Fire an electric nail dealing damage and Shocking.",                              upg:"More Shock damage."},
      {name:"Electrolyze",           type:"A",mp:7,  tier:"B",desc:"Electrolyze a wet target for massive damage.",                                   upg:"Works without Wet."},
      {name:"Shockwave",             type:"A",mp:7,  tier:"A",desc:"Emit a powerful shockwave in an area.",                                           upg:"Wider shockwave."},
      {name:"Short Circuit",         type:"A",mp:3,  tier:"B",desc:"Cause a short circuit for electric AoE damage.",                                 upg:"Wider circuit area."},
      {name:"Shock Therapy",         type:"A",mp:5,  tier:"B",desc:"Shocking therapy — damage + debuff.",                                             upg:"Stronger therapy."},
      {name:"Tesla Coil",            type:"A",mp:7,  tier:"B",desc:"Deploy a Tesla coil that zaps nearby enemies.",                                   upg:"More zap range."},
      {name:"Sparks",                type:"A",mp:7,  tier:"B",desc:"Release electrical sparks in an area.",                                           upg:"More sparks."},
      {name:"Firecracker",           type:"A",mp:5,  tier:"B",desc:"Throw a firecracker — small explosion.",                                          upg:"Bigger explosion."},
      {name:"Bombchu",               type:"A",mp:7,  tier:"B",desc:"Deploy a bomb that rolls toward enemies.",                                        upg:"Faster roll or more damage."},
      {name:"Remote Detonator",      type:"A",mp:4,  tier:"B",desc:"Remotely detonate placed bombs.",                                                 upg:"Unknown."},
      {name:"Autopilot",             type:"A",mp:10, tier:"B",desc:"Set devices on autopilot.",                                                        upg:"Unknown."},
      {name:"Reprogram",             type:"A",mp:3,  tier:"B",desc:"Reprogram a robot or gadget to do your bidding.",                                 upg:"Unknown."},
      {name:"Spawn Decoy",           type:"A",mp:8,  tier:"B",desc:"Spawn a decoy to distract enemies.",                                              upg:"Decoy has more HP."},
      {name:"Eject Button",          type:"A",mp:3,  tier:"B",desc:"Eject from a situation — escape movement.",                                       upg:"Longer ejection range."},
      {name:"Experimental Teleporter",type:"A",mp:7, tier:"B",desc:"Teleport to a random location (experimental!).",                                  upg:"Less random at Upgrade+."},
      {name:"Rocket Ride",           type:"A",mp:8,  tier:"A",desc:"Ride a rocket for massive movement and impact damage.",                           upg:"Longer ride or more damage."},
      {name:"Rocket Skates",         type:"A",mp:3,  tier:"B",desc:"Don rocket skates for enhanced movement.",                                        upg:"Faster skates."},
      {name:"Shoddy Jetpack",        type:"A",mp:6,  tier:"B",desc:"Fly briefly with a shoddy jetpack (unreliable).",                                 upg:"Less shoddy."},
      {name:"Spring Shoes",          type:"A",mp:2,  tier:"B",desc:"Jump over obstacles with spring shoes.",                                          upg:"Higher jump."},
      {name:"Drill Down",            type:"A",mp:5,  tier:"B",desc:"Drill through terrain or enemies.",                                               upg:"Faster drill."},
      {name:"Switcheroo",            type:"A",mp:6,  tier:"B",desc:"Swap your equipped weapon for something else.",                                   upg:"Better swap outcome."},
      {name:"Smash",                 type:"A",mp:5,  tier:"B",desc:"Smash with a gadget for high damage.",                                            upg:"More damage."},
      {name:"Volt Tackle",           type:"A",mp:7,  tier:"B",desc:"Tackle while electrified for massive damage.",                                   upg:"Higher dmg."},
      {name:"Shed Scrap",            type:"A",mp:1,  tier:"B",desc:"Shed scrap for resources or a minor effect.",                                     upg:"More scrap."},
      {name:"Math!",                 type:"A",mp:5,  tier:"B",desc:"Mathematical calculation for a bonus effect.",                                    upg:"Better math outcome."},
      {name:"Fresh off the Forge",   type:"A",mp:5,  tier:"A",desc:"Your next crafted weapon is extra powerful.",                                     upg:"Even more powerful."},
      {name:"Unreliable Missile Launcher",type:"A",mp:4,tier:"B",desc:"Fire a missile that may or may not work properly.",                           upg:"More reliable."},
      {name:"Unreliable Shield Generator",type:"A",mp:4,tier:"B",desc:"Generate a shield that may or may not last.",                                 upg:"More reliable."},
      {name:"Split the Atom",        type:"A",mp:50, tier:"C",desc:"Split the atom for maximum damage — costs 50 mana.",                              upg:"Lower cost at Upgrade+."},
      {name:"Hone",                  type:"A",mp:0,  tier:"B",desc:"Hone your weapon for better performance.",                                        upg:"Unknown."},
      // ── PASSIVES (25 total) ──
      {name:"Duct Tape",             type:"P",       tier:"S",desc:"Keep your crafted weapons across battles. THE mandatory passive for Tinkerer.",   upg:"Weapons degrade slower."},
      {name:"Item Proxy",            type:"P",       tier:"A",desc:"Treat your equipped items as a set for set bonus purposes.",                       upg:"Works with more item types."},
      {name:"v2.0",                  type:"P",       tier:"A",desc:"All your gadgets become v2.0 — more reliable and powerful.",                      upg:"Even higher reliability."},
      {name:"IT'S ALIVE!",           type:"P",       tier:"A",desc:"Your built robots/gadgets come to life with AI.",                                  upg:"Smarter AI."},
      {name:"Ingenuity",             type:"P",       tier:"A",desc:"Bonus effects from creative gadget combinations.",                                 upg:"More ingenuity bonus."},
      {name:"Weapon Proficiency",    type:"P",       tier:"A",desc:"Gain proficiency with crafted weapon types — bonus stats.",                       upg:"More weapon types covered."},
      {name:"Armored Plating",       type:"P",       tier:"A",desc:"Your armor is enhanced — additional defense.",                                    upg:"More defense."},
      {name:"Armor Specialist",      type:"P",       tier:"A",desc:"Expert armor use — maximize defense from equipment.",                              upg:"Higher armor efficiency."},
      {name:"Blacksmith",            type:"P",       tier:"A",desc:"Craft weapons of higher quality.",                                                  upg:"Even higher quality."},
      {name:"Energizer",             type:"P",       tier:"A",desc:"Your gadgets last longer and have more uses.",                                     upg:"Even more uses."},
      {name:"Living Battery",        type:"P",       tier:"A",desc:"You are a living battery — generate electricity passively.",                       upg:"More electricity generated."},
      {name:"Demo Man",              type:"P",       tier:"B",desc:"Your explosives are more powerful.",                                               upg:"Even bigger explosions."},
      {name:"Napalm",                type:"P",       tier:"B",desc:"Your explosives leave burning Napalm.",                                            upg:"Longer burn duration."},
      {name:"Conductor",             type:"P",       tier:"B",desc:"You conduct electricity — shock things near you.",                                 upg:"Wider shock radius."},
      {name:"Lightning Rod",         type:"P",       tier:"B",desc:"Draw lightning to yourself — redirect it at enemies.",                             upg:"Better redirection."},
      {name:"Robot Arms",            type:"P",       tier:"B",desc:"Robotic arms grant extra weapon actions.",                                         upg:"More arm actions."},
      {name:"Shrapnel",              type:"P",       tier:"B",desc:"Your explosions produce shrapnel that deals extra damage.",                        upg:"More shrapnel."},
      {name:"Reactive Armor",        type:"P",       tier:"B",desc:"Your armor reacts to damage — counterattack on hit.",                              upg:"Stronger reaction."},
      {name:"Booby Trap",            type:"P",       tier:"B",desc:"You leave booby traps when you move.",                                            upg:"More traps or higher dmg."},
      {name:"Nanobots",              type:"P",       tier:"B",desc:"Nanobots repair you and your gadgets each turn.",                                  upg:"More repairs."},
      {name:"Scrapper",              type:"P",       tier:"B",desc:"Gain resources from scrapping items.",                                             upg:"Better scrap quality."},
      {name:"EMP",                   type:"P",       tier:"B",desc:"Emit an EMP periodically that disables enemy gadgets.",                            upg:"More frequent EMP."},
      {name:"Escape Sequence",       type:"P",       tier:"B",desc:"Auto-escape when health is critical.",                                             upg:"Higher HP threshold."},
      {name:"Mr. Mega",              type:"P",       tier:"B",desc:"Your Mech becomes mega — enhanced stats.",                                         upg:"Even more mega."},
      {name:"Fuzzy Feet",            type:"P",       tier:"C",desc:"Electrostatic feet — minor shock effect on movement.",                             upg:"Unknown."},
    ],
  },

  Colorless: {
    icon:"🐱", role:"Generalist · 113 Abilities + 66 Passives (challenge/endgame only)",
    combos:["Skill Share (duplicate passive to entire party — Legendary, needs Boneyard clear)","Brainstorm (-1mp all spells)","Bare Minimum (stats never below 5)","Unrestricted (once-per-battle → once-per-turn)"],
    abilities:[
      // Key actives (113 total — showing most notable)
      {name:"Brainstorm",         type:"A",mp:7,  tier:"S",desc:"Reduce costs of all your other spells by 1 mana for this battle.",                 upg:"-2 mana at Upgrade+."},
      {name:"Second Wind",        type:"A",mp:8,  tier:"A",desc:"Refresh your basic attack, movement, weapon, and trinket. Once/battle.",            upg:"Once per turn at Upgrade+."},
      {name:"Copycat",            type:"A",mp:5,  tier:"A",desc:"Copy the last spell cast by an ally.",                                              upg:"Copy 2 spells ago."},
      {name:"Metronome",          type:"A",mp:5,  tier:"A",desc:"Use a random ability from any class.",                                              upg:"Better random pool."},
      {name:"Hire Hitman",        type:"A",mp:0,  tier:"A",desc:"Spend 7 coins to summon a bounty hunter. Once/turn.",                               upg:"Better hitman stats."},
      {name:"Hose Off",           type:"A",mp:5,  tier:"B",desc:"Spray water to remove debuffs and create a water puddle. Once/turn.",               upg:"Wider spray."},
      {name:"CPR",                type:"A",mp:6,  tier:"B",desc:"Revive an adjacent body to 1 HP. Inferior to Awaken (shorter range, no Holy).",    upg:"Unknown."},
      {name:"Brace",              type:"A",mp:3,  tier:"B",desc:"Gain temporary Shield.",                                                             upg:"More Shield."},
      {name:"Block",              type:"A",mp:5,  tier:"B",desc:"Negate the next hit taken.",                                                         upg:"Blocks 2 hits."},
      {name:"Boost",              type:"A",mp:3,  tier:"B",desc:"Increase range of your next spell cast.",                                            upg:"More range added."},
      {name:"Cat Nap",            type:"A",mp:2,  tier:"B",desc:"Briefly nap to recover a small amount of HP.",                                      upg:"More HP recovered."},
      {name:"Blow Kiss",          type:"A",mp:4,  tier:"B",desc:"Attempt to Charm a unit.",                                                           upg:"Higher Charm chance."},
      {name:"Confusion",          type:"A",mp:5,  tier:"B",desc:"Inflict Confusion on a unit — random actions.",                                     upg:"Longer Confusion."},
      {name:"Borrow Mana",        type:"A",mp:0,  tier:"B",desc:"Steal mana from an adjacent unit.",                                                  upg:"Steal from range."},
      {name:"Healing Bolt",       type:"A",mp:7,  tier:"B",desc:"Ranged bolt that heals allies or damages enemies.",                                  upg:"Higher heal/dmg."},
      {name:"Focus",              type:"A",mp:4,  tier:"B",desc:"Concentrate — next ability is enhanced.",                                            upg:"Better focus boost."},
      {name:"Flex",               type:"A",mp:5,  tier:"B",desc:"Flex to intimidate nearby enemies.",                                                 upg:"Stronger intimidation."},
      {name:"Gamble",             type:"A",mp:2,  tier:"B",desc:"Gamble for a random effect (could be good or bad).",                                upg:"Better RNG outcomes."},
      {name:"Find a Rock",        type:"A",mp:4,  tier:"B",desc:"Find and throw a rock.",                                                             upg:"Bigger rock."},
      {name:"Hop",                type:"A",mp:3,  tier:"B",desc:"Hop over an adjacent unit.",                                                          upg:"Hop further."},
      {name:"Hunt",               type:"A",mp:6,  tier:"B",desc:"Hunt a target — track and chase.",                                                  upg:"Better tracking."},
      {name:"Claws Out",          type:"A",mp:4,  tier:"B",desc:"Gain Thorns.",                                                                       upg:"Higher Thorns."},
      {name:"Minihook",           type:"A",mp:3,  tier:"B",desc:"Small hook to pull a unit.",                                                         upg:"Longer range."},
      {name:"Nerf",               type:"A",mp:4,  tier:"B",desc:"Nerf a target — reduce their effectiveness.",                                        upg:"Stronger nerf."},
      {name:"Invert",             type:"A",mp:2,  tier:"B",desc:"Invert a status effect.",                                                             upg:"Unknown."},
      {name:"Metabolize",         type:"A",mp:3,  tier:"B",desc:"Metabolize a debuff or food for HP.",                                               upg:"More HP."},
      {name:"Feather Feet",       type:"A",mp:4,  tier:"B",desc:"Light feet — enhanced movement.",                                                    upg:"More movement."},
      {name:"Doll Up",            type:"A",mp:2,  tier:"C",desc:"Dress up for a minor effect.",                                                       upg:"Unknown."},
      {name:"Dump",               type:"A",mp:3,  tier:"C",desc:"Dump an item.",                                                                      upg:"Unknown."},
      {name:"Butt Scoot",         type:"A",mp:4,  tier:"C",desc:"Scoot forward on your butt.",                                                        upg:"Unknown."},
      {name:"Burst",              type:"A",mp:7,  tier:"B",desc:"Burst of energy — AoE effect.",                                                      upg:"Larger burst."},
      {name:"Dart",               type:"A",mp:5,  tier:"B",desc:"Dart to a position quickly.",                                                        upg:"Longer dart."},
      {name:"Make a Wish",        type:"A",mp:0,  tier:"B",desc:"Wish for something — random great effect.",                                          upg:"Better wishes."},
      {name:"Gym Membership",     type:"A",mp:0,  tier:"B",desc:"Permanent STR/CON gains from working out.",                                          upg:"Unknown."},
      {name:"Hire Hitman",        type:"A",mp:0,  tier:"A",desc:"Spend coins to summon a powerful assassin ally.",                                    upg:"Stronger hitman."},
      {name:"BBQ",                type:"A",mp:5,  tier:"B",desc:"BBQ nearby enemies for fire damage.",                                               upg:"Wider BBQ area."},
      {name:"Blow",               type:"A",mp:4,  tier:"B",desc:"Blow wind at a target — knockback.",                                                 upg:"More knockback."},
      {name:"Cold Shoulder",      type:"A",mp:6,  tier:"B",desc:"Cold shoulder — apply Freeze or Slow.",                                             upg:"Higher Freeze."},
      {name:"Break Circuit",      type:"A",mp:6,  tier:"B",desc:"Break an electrical circuit — Shock damage.",                                       upg:"Wider circuit break."},
      {name:"Break Free",         type:"A",mp:0,  tier:"B",desc:"Break free from webs or immobilize.",                                               upg:"Unknown."},
      {name:"Barf Ball",          type:"A",mp:6,  tier:"C",desc:"Throw a ball of barf.",                                                              upg:"Unknown."},
      {name:"Ass Blast",          type:"A",mp:4,  tier:"C",desc:"Gas blast behind you.",                                                              upg:"Unknown."},
      {name:"Over There!",        type:"A",mp:2,  tier:"B",desc:"Redirect enemy attention.",                                                           upg:"Unknown."},
      {name:"Number One",         type:"A",mp:2,  tier:"C",desc:"Minor HP recovery.",                                                                 upg:"Unknown."},
      {name:"Look at me!",        type:"A",mp:2,  tier:"C",desc:"Taunt a single enemy.",                                                              upg:"Unknown."},
      {name:"Itch",               type:"A",mp:3,  tier:"C",desc:"Itch debuff on a target.",                                                           upg:"Unknown."},
      {name:"Knead",              type:"A",mp:5,  tier:"B",desc:"Knead to heal HP.",                                                                  upg:"More HP."},
      {name:"Lick",               type:"A",mp:4,  tier:"C",desc:"Lick for a minor effect.",                                                           upg:"Unknown."},
      {name:"Hiss",               type:"A",mp:6,  tier:"B",desc:"Hiss to frighten nearby enemies.",                                                   upg:"Wider fear."},
      {name:"Meow",               type:"A",mp:2,  tier:"C",desc:"Meow for a minor social effect.",                                                    upg:"Unknown."},
      {name:"Desecrate",          type:"A",mp:0,  tier:"C",desc:"Desecrate an area.",                                                                 upg:"Unknown."},
      {name:"Forbidden Fart",     type:"A",mp:0,  tier:"C",desc:"Forbidden gas ability.",                                                             upg:"Unknown."},
      {name:"Brain Missile",      type:"A",mp:0,  tier:"B",desc:"Fire a magic brain missile.",                                                        upg:"Unknown."},
      {name:"Interchange",        type:"A",mp:3,  tier:"B",desc:"Interchange positions.",                                                             upg:"Unknown."},
      {name:"Dexterous Hit",      type:"A",mp:6,  tier:"B",desc:"Dexterous melee hit.",                                                              upg:"Unknown."},
      {name:"Enter Mech",         type:"A",mp:0,  tier:"B",desc:"Enter a mech suit.",                                                                 upg:"Unknown."},
      {name:"Landscape",          type:"A",mp:1,  tier:"B",desc:"Reshape the terrain slightly.",                                                      upg:"More reshaping."},
      // Path abilities
      {name:"Path of the Fighter",  type:"A",mp:0, tier:"B",desc:"Learn a random Fighter ability.",                                                   upg:"Unknown."},
      {name:"Path of the Hunter",   type:"A",mp:5, tier:"B",desc:"Learn a random Hunter ability.",                                                    upg:"Unknown."},
      {name:"Path of the Mage",     type:"A",mp:12,tier:"B",desc:"Learn a random Mage ability.",                                                     upg:"Unknown."},
      {name:"Path of the Medic",    type:"A",mp:0, tier:"B",desc:"Learn a random Medic ability.",                                                     upg:"Unknown."},
      {name:"Path of the Necromancer",type:"A",mp:0,tier:"B",desc:"Learn a random Necromancer ability.",                                             upg:"Unknown."},
      {name:"Path of the Druid",    type:"A",mp:2, tier:"B",desc:"Learn a random Druid ability.",                                                     upg:"Unknown."},
      {name:"Path of the Monk",     type:"A",mp:0, tier:"B",desc:"Learn a random Monk ability.",                                                      upg:"Unknown."},
      {name:"Path of the Psychic",  type:"A",mp:0, tier:"B",desc:"Learn a random Psychic ability.",                                                   upg:"Unknown."},
      {name:"Path of the Tank",     type:"A",mp:0, tier:"B",desc:"Learn a random Tank ability.",                                                      upg:"Unknown."},
      {name:"Path of the Thief",    type:"A",mp:4, tier:"B",desc:"Learn a random Thief ability.",                                                     upg:"Unknown."},
      {name:"Path of the Tinkerer", type:"A",mp:0, tier:"B",desc:"Learn a random Tinkerer ability.",                                                  upg:"Unknown."},
      {name:"Path of the Butcher",  type:"A",mp:1, tier:"B",desc:"Learn a random Butcher ability.",                                                   upg:"Unknown."},
      {name:"Path of the Jester",   type:"A",mp:0, tier:"B",desc:"Learn a random Jester ability.",                                                    upg:"Unknown."},
      // ── PASSIVES (66 total — showing most notable) ──
      {name:"Skill Share",          type:"P",       tier:"S",desc:"Your other passive shared with ALL party members at battle start.",                upg:"Unknown."},
      {name:"Bare Minimum",         type:"P",       tier:"S",desc:"Your stats can never drop below 5. Negates all injury/disease/quest penalties.",   upg:"Unknown."},
      {name:"Unrestricted",         type:"P",       tier:"A",desc:"Once-per-battle actions become once-per-turn.",                                    upg:"Unknown."},
      {name:"Overconfident",        type:"P",       tier:"A",desc:"At full HP: spell costs reduced by 2 (min 1). But you take double damage.",         upg:"Assumed: lower penalty."},
    ],
  },

  Jester: {
    icon:"🃏", role:"Chaos · Draws from all class pools (no stat modifiers)",
    combos:["Pray for S-tier abilities from any class during draft","Smart Metronome for pseudo-controlled RNG","Adapt to whatever the RNG offers"],
    abilities:[
      {name:"Smart Metronome",  type:"A",mp:5,  tier:"A",desc:"Use a less-random version of Metronome — better RNG pool.",                          upg:"Even better pool."},
      {name:"RNG Cannon",       type:"A",mp:10, tier:"B",desc:"Fire from a random cannon — unpredictable but potentially massive.",                   upg:"Better outcomes."},
      {name:"Power Up",         type:"A",mp:0,  tier:"B",desc:"Power up — random stat boost.",                                                        upg:"Better boosts."},
      {name:"Bump",             type:"A",mp:1,  tier:"B",desc:"Bump into something for a random effect.",                                             upg:"Unknown."},
      {name:"Goofball",         type:"P",       tier:"B",desc:"Chaotic passive — random bonus each turn.",                                             upg:"Better chaos outcomes."},
      {name:"Super Luck",       type:"P",       tier:"A",desc:"Massively increased LCK — crits everywhere.",                                          upg:"Even more LCK."},
    ],
  },
};

// ─── FUZZY SEARCH ─────────────────────────────────────────────
function fuzzyScore(q, s) {
  const ql = q.toLowerCase().trim();
  const sl = s.toLowerCase();
  if (!ql) return 0;
  if (sl === ql) return 100;
  if (sl.startsWith(ql)) return 90;
  if (sl.includes(" " + ql) || sl.includes(ql + " ")) return 85;
  if (sl.includes(ql)) return 70;
  const words = sl.split(/[\s\-_!?]/);
  if (words.some(w => w.startsWith(ql))) return 60;
  // subsequence
  let qi = 0;
  for (let i = 0; i < sl.length && qi < ql.length; i++) {
    if (sl[i] === ql[qi]) qi++;
  }
  if (qi === ql.length) return Math.max(10, 40 - (sl.length - ql.length));
  return 0;
}

function searchAbilities(query, classFilter) {
  if (!query || query.length < 1) return [];
  const results = [];
  Object.entries(KB).forEach(([cls, data]) => {
    if (classFilter && cls !== classFilter) return;
    data.abilities.forEach(ab => {
      const nameScore = fuzzyScore(query, ab.name);
      const descScore = fuzzyScore(query, ab.desc) * 0.3;
      const score = Math.max(nameScore, descScore);
      if (score > 15) results.push({ ...ab, cls, clsIcon: data.icon, score });
    });
  });
  return results.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name)).slice(0, 15);
}

// ─── HOOKS ────────────────────────────────────────────────────
function useIsMobile() {
  const [mob, setMob] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);
  useEffect(() => {
    const h = () => setMob(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return mob;
}

// ─── SYSTEM PROMPT ────────────────────────────────────────────
function buildPrompt(cls, picks) {
  const d = KB[cls];
  const pickInfo = picks.map(p => {
    const found = d?.abilities.find(a => a.name === p.name) || p;
    return `- ${p.name} [${found.tier||"?"}] (${p.cls !== cls ? p.cls+" class, cross-class pick" : cls+" class"})${found.desc ? ": "+found.desc : ""}`;
  }).join("\n");
  const abStr = d?.abilities.slice(0,40).map(a =>
    `  [${a.tier}] ${a.name} (${a.type==="A"?"Active":"Passive"}${a.mp!=null?" "+a.mp+"mp":""}): ${a.desc}`
  ).join("\n") || "";
  return `You are Mewbot — elite Mewgenics tactical draft advisor. Expert, cutthroat, concise.
CLASS: ${cls} | ROLE: ${d?.role||"Unknown"}
BROKEN COMBOS: ${d?.combos?.join(" | ")||"None known"}
KEY ABILITIES (top 40):
${abStr}
GLOBAL COMBOS TO WATCH:
- Hunter Exodia: Marked+Arrow Flurry/Heavy Shot (guaranteed crits)
- Fighter Blender: Gravity Slam+Spin (pull+delete)
- Infinite Engine: Zoomzerk+Merciless (chain dashes)
- Fly Swarm: Duke of Flies+Incubator+Spoil (infinite flies)
- Psychic Loop: Enlightened+Become Entropy (free board wipes)
- Soul Chain: Soul Link+Spread Sorrow (chain all dmg)
- Medic Battery: Adoubment on Tank (stat stacking)
PLAYER'S DRAFT PICKS:
${pickInfo || "None selected yet."}
OUTPUT FORMAT — follow EXACTLY:
### THE SCAN
- **[Name] — [Tier]**: one sentence.
### ANALYSIS
2-3 sentences. Call out broken combos. Warn counter-synergies.
### UPGRADE+ HORIZON
1-2 sentences on how top picks scale.
### VERDICT
**TAKE:** [Name] — one sentence why.
**PIVOT:** [Name] if [condition].`;
}

// ─── UI HELPERS ───────────────────────────────────────────────
const TSBADGE = (tier, small) => ({
  background: TC[tier]?.color||"#666", color:"#000",
  fontWeight:900, fontSize:small?"9px":"10px",
  padding:small?"1px 4px":"2px 6px", borderRadius:"3px", flexShrink:0,
});
const TYPEBADGE = (type) => ({
  fontSize:"9px", padding:"1px 5px", borderRadius:"3px", flexShrink:0,
  background:type==="A"?"rgba(96,165,250,0.15)":"rgba(248,120,172,0.15)",
  color:type==="A"?"#60a5fa":"#f472b6",
});

// ─── ABILITY CARD (tier list) ─────────────────────────────────
function TierCard({ ab, highlighted, isMobile }) {
  const [expanded, setExpanded] = useState(false);
  const t = TC[ab.tier]||TC.C;
  return (
    <div onClick={()=>isMobile&&setExpanded(e=>!e)}
      style={{ borderRadius:7,overflow:"hidden",position:"relative",cursor:isMobile?"pointer":"default",transition:"all 0.12s",
        background:highlighted?`${t.color}18`:t.bg, border:`1px solid ${highlighted?t.color+"55":t.border}`,
        boxShadow:highlighted?`0 0 10px ${t.color}18`:"none" }}>
      {highlighted&&<div style={{ position:"absolute",top:3,right:3,width:5,height:5,background:t.color,borderRadius:"50%",boxShadow:`0 0 5px ${t.color}` }} />}
      <div style={{ display:"flex",alignItems:"center",gap:7,padding:isMobile?"10px 11px":"6px 9px" }}>
        <span style={TYPEBADGE(ab.type)}>{ab.type==="A"?(ab.mp!=null?`${ab.mp}mp`:"ACT"):"PAS"}</span>
        <span style={{ color:highlighted?"#f1f5f9":"#cbd5e1",fontSize:isMobile?14:12,fontWeight:highlighted?700:500,flex:1,lineHeight:1.2 }}>{ab.name}</span>
        {isMobile&&<span style={{ color:"#334155",fontSize:10 }}>{expanded?"▲":"▼"}</span>}
      </div>
      {isMobile&&expanded&&(
        <div style={{ padding:"0 11px 10px",borderTop:`1px solid ${t.border}` }}>
          <div style={{ color:"#94a3b8",fontSize:12,lineHeight:1.5,marginTop:6 }}>{ab.desc}</div>
          <div style={{ color:t.color,fontSize:11,marginTop:5 }}>⬆ {ab.upg}</div>
        </div>
      )}
    </div>
  );
}

function DesktopTierCard({ ab, highlighted }) {
  const [tip,setTip]=useState(false);
  const [pos,setPos]=useState({x:0,y:0});
  const t=TC[ab.tier]||TC.C;
  return (
    <div style={{ position:"relative" }}>
      <div onMouseEnter={e=>{setTip(true);setPos({x:e.clientX,y:e.clientY})}}
           onMouseMove={e=>setPos({x:e.clientX,y:e.clientY})}
           onMouseLeave={()=>setTip(false)}
        style={{ display:"flex",alignItems:"center",gap:7,padding:"6px 9px",borderRadius:6,cursor:"default",position:"relative",
          background:highlighted?`${t.color}18`:t.bg,border:`1px solid ${highlighted?t.color+"55":t.border}`,
          boxShadow:highlighted?`0 0 10px ${t.color}18`:"none",transition:"all 0.12s" }}>
        {highlighted&&<div style={{ position:"absolute",top:-2,right:-2,width:5,height:5,background:t.color,borderRadius:"50%",boxShadow:`0 0 5px ${t.color}` }} />}
        <span style={TYPEBADGE(ab.type)}>{ab.type==="A"?(ab.mp!=null?`${ab.mp}mp`:"ACT"):"PAS"}</span>
        <span style={{ color:highlighted?"#f1f5f9":"#cbd5e1",fontSize:12,fontWeight:highlighted?700:500 }}>{ab.name}</span>
      </div>
      {tip&&(
        <div style={{ position:"fixed",left:pos.x+14,top:Math.min(pos.y-10,window.innerHeight-180),zIndex:9999,pointerEvents:"none",width:250,
          background:"#0d1117",border:`1px solid ${t.border}`,borderRadius:8,padding:"10px 13px",boxShadow:"0 8px 32px rgba(0,0,0,0.7)" }}>
          <div style={{ display:"flex",gap:7,alignItems:"center",marginBottom:6 }}>
            <span style={TSBADGE(ab.tier)}>{ab.tier}</span>
            <span style={{ color:"#f1f5f9",fontWeight:700,fontSize:12,flex:1 }}>{ab.name}</span>
            <span style={TYPEBADGE(ab.type)}>{ab.type==="A"?(ab.mp!=null?`Active·${ab.mp}mp`:"Active"):"Passive"}</span>
          </div>
          <div style={{ color:"#94a3b8",fontSize:11,lineHeight:1.5,marginBottom:5 }}>{ab.desc}</div>
          <div style={{ color:t.color,fontSize:10 }}>⬆ {ab.upg}</div>
        </div>
      )}
    </div>
  );
}

function TierRow({ tier, abs, highlighted, isMobile }) {
  const t=TC[tier];
  if(!abs.length) return null;
  return (
    <div style={{ display:"flex",marginBottom:isMobile?8:6 }}>
      <div style={{ width:isMobile?34:34,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",
        background:t.bg,border:`1px solid ${t.border}`,borderRadius:"6px 0 0 6px",borderRight:"none" }}>
        <span style={{ color:t.color,fontWeight:900,fontSize:isMobile?19:16,fontFamily:"'Bebas Neue',Impact,sans-serif" }}>{tier}</span>
      </div>
      <div style={{ flex:1,padding:isMobile?"7px 8px":"5px 8px",background:`${t.bg}66`,border:`1px solid ${t.border}`,
        borderRadius:"0 6px 6px 0",display:"flex",flexWrap:"wrap",gap:isMobile?6:5,alignItems:"flex-start" }}>
        {abs.map(ab=>isMobile
          ?<TierCard key={ab.name+ab.mp} ab={ab} highlighted={highlighted.includes(ab.name)} isMobile/>
          :<DesktopTierCard key={ab.name+ab.mp} ab={ab} highlighted={highlighted.includes(ab.name)}/>
        )}
      </div>
    </div>
  );
}

// ─── ORACLE OUTPUT ────────────────────────────────────────────
function OracleOutput({ text, onClear, isMobile }) {
  const lines = text.split("\n");
  return (
    <div style={{ padding:isMobile?"12px 14px":"10px 14px" }}>
      {lines.map((line,i)=>{
        if(line.startsWith("### ")) return <div key={i} style={{ color:"#ff9d00",fontWeight:700,fontSize:10,letterSpacing:"2px",textTransform:"uppercase",marginTop:i===0?0:14,marginBottom:5,paddingBottom:4,borderBottom:"1px solid rgba(255,157,0,0.18)" }}>{line.replace("### ","")}</div>;
        if(line.startsWith("**TAKE:**")||line.startsWith("**PIVOT:**")){
          const isT=line.startsWith("**TAKE:**");
          const color=isT?"#ff9d00":"#60a5fa";
          const rest=line.replace(/\*\*(TAKE|PIVOT):\*\*/,"").trim();
          return <div key={i} style={{ margin:"5px 0",padding:isMobile?"10px 12px":"7px 10px",background:`${color}0e`,border:`1px solid ${color}30`,borderRadius:6 }}><span style={{ color,fontWeight:800,fontSize:isMobile?11:10,letterSpacing:"1px" }}>{isT?"▶ TAKE":"◆ PIVOT"} </span><span style={{ color:"#e2e8f0",fontSize:isMobile?13:11 }}>{rest}</span></div>;
        }
        const tb=line.match(/^- \*\*(.+?) — (S|A|B|C)\*\*:(.*)/);
        if(tb){const[,name,tier,desc]=tb;const tc=TC[tier]||{color:"#888"};return <div key={i} style={{ display:"flex",gap:7,alignItems:"baseline",marginBottom:5 }}><span style={TSBADGE(tier,true)}>{tier}</span><span style={{ color:"#cbd5e1",fontSize:isMobile?13:11,fontWeight:600 }}>{name}:</span><span style={{ color:"#64748b",fontSize:isMobile?12:11,flex:1 }}>{desc.trim()}</span></div>;}
        if(line.trim()==="") return <div key={i} style={{ height:4 }} />;
        const parts=line.split(/(\*\*[^*]+\*\*)/g);
        return <div key={i} style={{ color:"#64748b",fontSize:isMobile?13:11,lineHeight:1.6,marginBottom:2 }}>{parts.map((p,j)=>p.startsWith("**")&&p.endsWith("**")?<span key={j} style={{ color:"#cbd5e1",fontWeight:700 }}>{p.slice(2,-2)}</span>:p)}</div>;
      })}
      <button onClick={onClear} style={{ marginTop:16,width:"100%",padding:isMobile?10:7,borderRadius:6,background:"transparent",border:"1px solid #1e293b",color:"#334155",fontSize:11,letterSpacing:"1px",cursor:"pointer",fontFamily:"inherit" }}>↺ NEW QUERY</button>
    </div>
  );
}

// ─── ORACLE TAB (fuzzy search + picks) ───────────────────────
function OracleTab({ activeClass, isMobile }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [picks, setPicks] = useState([]);
  const [crossClass, setCrossClass] = useState(false);
  const [context, setContext] = useState("");
  const [oracleText, setOracleText] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if(query.length>=1) setResults(searchAbilities(query, crossClass?null:activeClass));
    else setResults([]);
  }, [query, activeClass, crossClass]);

  const addPick = useCallback((ab) => {
    if(picks.length>=4||picks.find(p=>p.name===ab.name)) return;
    setPicks(prev=>[...prev,ab]);
    setQuery("");
    setResults([]);
    if(!isMobile) inputRef.current?.focus();
  }, [picks, isMobile]);

  const removePick = (name) => setPicks(prev=>prev.filter(p=>p.name!==name));

  const handleConsult = async () => {
    if(!picks.length) return;
    setLoading(true); setOracleText(null);
    try {
      const res = await fetch("/api/oracle",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ model:"claude-sonnet-4-6",max_tokens:1000,
          system:buildPrompt(activeClass,picks),
          messages:[{role:"user",content:`Analyze my ${activeClass} draft picks:\n${picks.map(p=>`- ${p.name} (${p.cls})`).join("\n")}${context?`\nContext: ${context}`:""}`}] }),
      });
      const data=await res.json();
      setOracleText(data.content?.map(b=>b.text||"").join("\n")||"Mewbot is silent...");
    } catch { setOracleText("Connection failed."); }
    setLoading(false);
  };

  const handleClear = () => { setOracleText(null); setPicks([]); setQuery(""); setContext(""); };

  if(oracleText) return <div style={{ flex:1,overflowY:"auto" }}><OracleOutput text={oracleText} onClear={handleClear} isMobile={isMobile}/></div>;

  return (
    <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden" }}>
      <div style={{ padding:isMobile?"12px 14px 8px":"10px 12px 6px",borderBottom:"1px solid #0f172a",flexShrink:0 }}>
        <div style={{ color:"#ff9d00",fontSize:9,letterSpacing:"2px",marginBottom:8,fontWeight:700 }}>ABILITY LOOKUP</div>
        <div style={{ position:"relative" }}>
          <span style={{ position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",color:"#334155",fontSize:isMobile?17:14,pointerEvents:"none" }}>🔍</span>
          <input ref={inputRef} autoFocus={!isMobile} value={query} onChange={e=>setQuery(e.target.value)}
            placeholder="Type ability name..." autoComplete="off" autoCorrect="off"
            style={{ width:"100%",background:"#0d1117",border:"1px solid #1e3a5f",borderRadius:8,
              padding:isMobile?"12px 36px 12px 38px":"9px 34px 9px 34px",color:"#e2e8f0",
              fontSize:isMobile?16:13,outline:"none",fontFamily:"inherit" }}
            onFocus={e=>e.target.style.borderColor="rgba(255,157,0,0.5)"}
            onBlur={e=>e.target.style.borderColor="#1e3a5f"}/>
          {query&&<button onClick={()=>{setQuery("");inputRef.current?.focus();}} style={{ position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#475569",cursor:"pointer",fontSize:18,padding:"2px 4px",lineHeight:1 }}>✕</button>}
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:8,marginTop:7 }}>
          <button onClick={()=>setCrossClass(c=>!c)}
            style={{ display:"flex",alignItems:"center",gap:5,padding:"4px 9px",borderRadius:5,cursor:"pointer",fontFamily:"inherit",fontSize:10,fontWeight:700,
              border:`1px solid ${crossClass?"rgba(255,157,0,0.4)":"rgba(255,255,255,0.08)"}`,
              background:crossClass?"rgba(255,157,0,0.08)":"transparent",
              color:crossClass?"#ff9d00":"#475569" }}>
            <span style={{ width:12,height:12,borderRadius:2,border:`1px solid ${crossClass?"#ff9d00":"#475569"}`,background:crossClass?"#ff9d00":"transparent",display:"inline-block",flexShrink:0 }}/>
            ALL CLASSES
          </button>
          <span style={{ color:"#1e293b",fontSize:9 }}>default: {activeClass} only</span>
        </div>
      </div>

      {results.length>0&&(
        <div style={{ flexShrink:0,borderBottom:"1px solid #0f172a",maxHeight:isMobile?240:210,overflowY:"auto" }}>
          {results.map((ab,ri)=>{
            const t=TC[ab.tier]||TC.C;
            const picked=picks.some(p=>p.name===ab.name);
            return (
              <div key={`${ab.cls}-${ab.name}-${ri}`} onClick={()=>!picked&&addPick(ab)}
                style={{ display:"flex",alignItems:"center",gap:8,padding:isMobile?"11px 14px":"8px 12px",
                  cursor:picked?"default":"pointer",borderBottom:"1px solid #0a0e17",
                  background:picked?"rgba(255,255,255,0.02)":"transparent",opacity:picked?0.4:1,transition:"background 0.1s" }}
                onMouseEnter={e=>{if(!picked&&!isMobile)e.currentTarget.style.background="rgba(255,157,0,0.05)"}}
                onMouseLeave={e=>{e.currentTarget.style.background=picked?"rgba(255,255,255,0.02)":"transparent"}}>
                <span style={TSBADGE(ab.tier)}>{ab.tier}</span>
                <span style={{ color:"#e2e8f0",fontSize:isMobile?14:12,fontWeight:600,flex:1 }}>{ab.name}</span>
                <span style={TYPEBADGE(ab.type)}>{ab.type==="A"?(ab.mp!=null?`${ab.mp}mp`:"ACT"):"PAS"}</span>
                {crossClass&&<span style={{ fontSize:9,color:"#334155",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:3,padding:"1px 5px",flexShrink:0 }}>{ab.clsIcon}</span>}
                {picked?<span style={{ fontSize:10,color:"#334155",flexShrink:0 }}>✓</span>:<span style={{ fontSize:isMobile?18:14,color:"rgba(255,157,0,0.5)",flexShrink:0 }}>+</span>}
              </div>
            );
          })}
        </div>
      )}
      {query.length>=1&&results.length===0&&(
        <div style={{ padding:"14px",textAlign:"center",color:"#334155",fontSize:11,borderBottom:"1px solid #0f172a" }}>
          No matches{crossClass?"":" in "+activeClass} — enable ALL CLASSES or try a different name
        </div>
      )}

      <div style={{ flex:1,overflowY:"auto",padding:isMobile?"12px 14px":"10px 12px" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8 }}>
          <span style={{ color:picks.length?"#ff9d00":"#334155",fontSize:9,letterSpacing:"2px",fontWeight:700 }}>SELECTED ({picks.length}/4)</span>
          {picks.length>0&&<button onClick={()=>setPicks([])} style={{ background:"none",border:"none",color:"#334155",fontSize:10,cursor:"pointer",fontFamily:"inherit" }}>clear all</button>}
        </div>
        {picks.length===0?(
          <div style={{ padding:"28px 0",textAlign:"center" }}>
            <div style={{ fontSize:28,marginBottom:8,opacity:0.2 }}>+</div>
            <div style={{ color:"#1e293b",fontSize:11 }}>Search and tap abilities above</div>
            <div style={{ color:"#1e293b",fontSize:10,marginTop:4 }}>{Object.values(KB).reduce((s,d)=>s+d.abilities.length,0)} abilities across {Object.keys(KB).length} classes</div>
          </div>
        ):(
          picks.map((ab,i)=>{
            const t=TC[ab.tier]||TC.C;
            return (
              <div key={ab.name} style={{ display:"flex",alignItems:"center",gap:8,padding:isMobile?"11px 12px":"8px 10px",marginBottom:6,borderRadius:8,background:t.bg,border:`1px solid ${t.border}` }}>
                <span style={{ color:"#334155",fontSize:11,fontWeight:700,width:14,textAlign:"center",flexShrink:0 }}>{i+1}</span>
                <span style={TSBADGE(ab.tier)}>{ab.tier}</span>
                <span style={{ color:"#e2e8f0",fontSize:isMobile?14:12,fontWeight:600,flex:1 }}>{ab.name}</span>
                <span style={TYPEBADGE(ab.type)}>{ab.type==="A"?(ab.mp!=null?`${ab.mp}mp`:"ACT"):"PAS"}</span>
                {ab.cls!==activeClass&&<span style={{ fontSize:9,color:"#475569",flexShrink:0 }}>{ab.clsIcon}</span>}
                <button onClick={()=>removePick(ab.name)} style={{ background:"none",border:"none",color:"#475569",cursor:"pointer",fontSize:18,padding:"0 2px",lineHeight:1,flexShrink:0 }}>×</button>
              </div>
            );
          })
        )}
        {picks.length>0&&(
          <>
            <input value={context} onChange={e=>setContext(e.target.value)} placeholder="Context — Act, party, existing build..."
              style={{ width:"100%",marginTop:8,background:"#0d1117",border:"1px solid #0f172a",borderRadius:6,padding:isMobile?"10px 12px":"7px 10px",color:"#475569",fontSize:isMobile?13:11,outline:"none",fontFamily:"inherit" }}/>
            <button onClick={handleConsult} disabled={loading}
              style={{ width:"100%",marginTop:10,padding:isMobile?13:9,borderRadius:7,cursor:loading?"not-allowed":"pointer",
                background:"rgba(255,157,0,0.14)",border:"1px solid rgba(255,157,0,0.45)",color:"#ff9d00",
                fontFamily:"inherit",fontWeight:700,fontSize:isMobile?13:11,letterSpacing:"2px",transition:"all 0.15s" }}>
              {loading?"⟳ ASKING...":"🔮 ASK MEWBOT"}
            </button>
          </>
        )}
        {loading&&<div style={{ padding:"14px",display:"flex",alignItems:"center",gap:10 }}><div style={{ width:8,height:8,borderRadius:"50%",background:"#ff9d00",animation:"pulse 1s ease-in-out infinite" }}/><span style={{ color:"#ff9d00",fontSize:11,letterSpacing:"1px" }}>MEWBOT ANALYZING...</span></div>}
      </div>
    </div>
  );
}

// ─── CLASS PICKER ─────────────────────────────────────────────
function MobileClassPicker({ active, onSelect, onClose }) {
  return (
    <div style={{ position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,0.85)",backdropFilter:"blur(4px)",display:"flex",flexDirection:"column" }} onClick={onClose}>
      <div style={{ flex:1 }}/>
      <div onClick={e=>e.stopPropagation()} style={{ background:"#080c12",borderTop:"1px solid rgba(255,157,0,0.2)",borderRadius:"16px 16px 0 0",padding:"14px 12px 28px" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}>
          <span style={{ color:"#ff9d00",fontSize:10,letterSpacing:"2px",fontWeight:700 }}>SELECT CLASS</span>
          <button onClick={onClose} style={{ background:"none",border:"none",color:"#334155",fontSize:20,cursor:"pointer" }}>✕</button>
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7 }}>
          {Object.entries(KB).map(([cls,d])=>(
            <button key={cls} onClick={()=>{onSelect(cls);onClose();}}
              style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"9px 4px",borderRadius:8,cursor:"pointer",fontFamily:"inherit",
                background:active===cls?"rgba(255,157,0,0.12)":"rgba(255,255,255,0.03)",
                border:active===cls?"1px solid rgba(255,157,0,0.45)":"1px solid rgba(255,255,255,0.06)",
                color:active===cls?"#ff9d00":"#475569" }}>
              <span style={{ fontSize:20 }}>{d.icon}</span>
              <span style={{ fontSize:9,fontWeight:active===cls?700:400,textAlign:"center",lineHeight:1.2 }}>{cls}</span>
              <span style={{ fontSize:8,color:"#334155" }}>{d.abilities.length}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ──────────────────────────────────────────────────
export default function App() {
  const isMobile = useIsMobile();
  const [activeClass, setActiveClass] = useState("Hunter");
  const [mobileTab, setMobileTab] = useState("tier");
  const [showPicker, setShowPicker] = useState(false);

  const d = KB[activeClass]||{abilities:[],combos:[],role:"",icon:"🐱"};
  const tierAbs = useMemo(()=>TIERS.reduce((acc,t)=>{acc[t]=d.abilities.filter(a=>a.tier===t);return acc;},{}), [d]);

  const totalAbilities = useMemo(()=>Object.values(KB).reduce((s,cl)=>s+cl.abilities.length,0), []);

  // ── MOBILE ─────────────────────────────────────────────────
  if(isMobile) return (
    <div style={{ height:"100dvh",background:"#080c12",color:"#e2e8f0",display:"flex",flexDirection:"column",fontFamily:"'DM Mono','Courier New',monospace",overflow:"hidden" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Bebas+Neue&display=swap');*{box-sizing:border-box;margin:0;padding:0}input::placeholder{color:#1e293b}::-webkit-scrollbar{width:2px}::-webkit-scrollbar-thumb{background:rgba(255,157,0,0.12)}@keyframes pulse{0%,100%{opacity:0.3;transform:scale(0.8)}50%{opacity:1;transform:scale(1)}}`}</style>
      <div style={{ background:"#060a0f",borderBottom:"1px solid rgba(255,157,0,0.1)",padding:"10px 14px",display:"flex",alignItems:"center",gap:10,flexShrink:0 }}>
        <span style={{ fontSize:15 }}>🔮</span>
        <span style={{ color:"#ff9d00",fontWeight:700,fontSize:13,letterSpacing:"2px",fontFamily:"'Bebas Neue',sans-serif" }}>MEWBOT</span>
        <button onClick={()=>setShowPicker(true)} style={{ marginLeft:"auto",display:"flex",alignItems:"center",gap:6,background:"rgba(255,157,0,0.08)",border:"1px solid rgba(255,157,0,0.28)",borderRadius:6,padding:"6px 10px",cursor:"pointer",color:"#ff9d00",fontFamily:"inherit",fontSize:12,fontWeight:700 }}>
          <span>{d.icon}</span><span>{activeClass}</span><span style={{ color:"#334155",fontSize:10 }}>▼</span>
        </button>
      </div>
      {mobileTab==="tier"&&d.combos.length>0&&(
        <div style={{ padding:"7px 12px",borderBottom:"1px solid #0f172a",display:"flex",gap:6,overflowX:"auto",flexShrink:0 }}>
          {d.combos.map((c,i)=><span key={i} style={{ fontSize:10,color:"#ff9d00",background:"rgba(255,157,0,0.06)",border:"1px solid rgba(255,157,0,0.16)",borderRadius:4,padding:"3px 8px",whiteSpace:"nowrap",flexShrink:0 }}>⚡ {c}</span>)}
        </div>
      )}
      <div style={{ flex:1,overflowY:"auto",display:"flex",flexDirection:"column" }}>
        {mobileTab==="tier"&&(
          <div style={{ padding:"10px 12px 90px" }}>
            {TIERS.map(t=><TierRow key={t} tier={t} abs={tierAbs[t]||[]} highlighted={[]} isMobile/>)}
            <div style={{ display:"flex",gap:10,marginTop:8,paddingTop:6,borderTop:"1px solid #0f172a" }}>
              <span style={{ fontSize:10,color:"#60a5fa" }}>■ mp=Active</span>
              <span style={{ fontSize:10,color:"#f472b6" }}>■ PAS=Passive</span>
              <span style={{ fontSize:10,color:"#334155" }}>Tap card for details</span>
            </div>
          </div>
        )}
        {mobileTab==="oracle"&&<OracleTab activeClass={activeClass} isMobile/>}
      </div>
      <div style={{ position:"fixed",bottom:0,left:0,right:0,background:"#060a0f",borderTop:"1px solid rgba(255,157,0,0.1)",display:"flex",paddingBottom:"env(safe-area-inset-bottom)",zIndex:100 }}>
        {[{id:"tier",icon:"📋",label:"TIER LIST"},{id:"oracle",icon:"🔮",label:"MEWBOT"}].map(tab=>(
          <button key={tab.id} onClick={()=>setMobileTab(tab.id)} style={{ flex:1,padding:"11px 8px",display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer",background:"transparent",border:"none",fontFamily:"inherit",borderTop:`2px solid ${mobileTab===tab.id?"#ff9d00":"transparent"}`,color:mobileTab===tab.id?"#ff9d00":"#334155" }}>
            <span style={{ fontSize:18 }}>{tab.icon}</span>
            <span style={{ fontSize:9,letterSpacing:"1px",fontWeight:700 }}>{tab.label}</span>
          </button>
        ))}
      </div>
      {showPicker&&<MobileClassPicker active={activeClass} onSelect={cls=>{setActiveClass(cls);}} onClose={()=>setShowPicker(false)}/>}
    </div>
  );

  // ── DESKTOP ────────────────────────────────────────────────
  return (
    <div style={{ height:"100vh",background:"#080c12",color:"#e2e8f0",display:"flex",flexDirection:"column",fontFamily:"'DM Mono','Courier New',monospace",overflow:"hidden" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Bebas+Neue&display=swap');*{box-sizing:border-box;margin:0;padding:0}input::placeholder{color:#1e293b}::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:rgba(255,157,0,0.12);border-radius:2px}@keyframes pulse{0%,100%{opacity:0.3;transform:scale(0.8)}50%{opacity:1;transform:scale(1)}}`}</style>
      <div style={{ background:"#060a0f",borderBottom:"1px solid rgba(255,157,0,0.1)",padding:"8px 16px",display:"flex",alignItems:"center",gap:12,flexShrink:0 }}>
        <span style={{ fontSize:15 }}>🔮</span>
        <span style={{ color:"#ff9d00",fontWeight:700,fontSize:12,letterSpacing:"3px",fontFamily:"'Bebas Neue',sans-serif" }}>MEWBOT</span>
        <span style={{ color:"#1e3a5f",fontSize:9,letterSpacing:"2px" }}>DRAFT ADVISOR · {totalAbilities} ABILITIES INDEXED</span>
      </div>
      <div style={{ background:"#060a0f",borderBottom:"1px solid #0f172a",padding:"5px 12px",display:"flex",gap:4,overflowX:"auto",flexShrink:0 }}>
        {Object.entries(KB).map(([cls,cd])=>{
          const act=cls===activeClass;
          return <button key={cls} onClick={()=>setActiveClass(cls)} style={{ display:"flex",alignItems:"center",gap:4,flexShrink:0,padding:"4px 9px",borderRadius:5,cursor:"pointer",background:act?"rgba(255,157,0,0.1)":"transparent",border:act?"1px solid rgba(255,157,0,0.38)":"1px solid rgba(255,255,255,0.05)",color:act?"#ff9d00":"#334155",fontFamily:"inherit",fontSize:10,fontWeight:act?700:400,transition:"all 0.1s" }}><span>{cd.icon}</span><span>{cls}</span><span style={{ color:act?"rgba(255,157,0,0.5)":"#1e293b",fontSize:8 }}>{cd.abilities.length}</span></button>;
        })}
      </div>
      <div style={{ flex:1,display:"flex",overflow:"hidden" }}>
        <div style={{ flex:1,overflowY:"auto",padding:"12px 14px",display:"flex",flexDirection:"column" }}>
          <div style={{ marginBottom:10,paddingBottom:8,borderBottom:"1px solid #0f172a" }}>
            <div style={{ display:"flex",alignItems:"center",gap:10,flexWrap:"wrap" }}>
              <span style={{ fontSize:17 }}>{d.icon}</span>
              <span style={{ color:"#f1f5f9",fontWeight:700,fontSize:14,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"2px" }}>{activeClass}</span>
              <span style={{ color:"#334155",fontSize:9 }}>·</span>
              <span style={{ color:"#475569",fontSize:10,flex:1 }}>{d.role}</span>
              <span style={{ color:"#1e293b",fontSize:9 }}>{d.abilities.length} abilities</span>
            </div>
            {d.combos.length>0&&<div style={{ display:"flex",flexWrap:"wrap",gap:5,marginTop:7 }}>{d.combos.map((c,i)=><span key={i} style={{ fontSize:9,color:"#ff9d00",background:"rgba(255,157,0,0.06)",border:"1px solid rgba(255,157,0,0.18)",borderRadius:3,padding:"2px 7px" }}>⚡ {c}</span>)}</div>}
          </div>
          <div style={{ flex:1 }}>
            {TIERS.map(t=><TierRow key={t} tier={t} abs={tierAbs[t]||[]} highlighted={[]} isMobile={false}/>)}
          </div>
          <div style={{ display:"flex",gap:12,marginTop:10,paddingTop:6,borderTop:"1px solid #0f172a" }}>
            <span style={{ fontSize:9,color:"#1e293b" }}>HOVER FOR DETAILS</span>
            <span style={{ fontSize:9,color:"#60a5fa" }}>■ ACT=Active</span>
            <span style={{ fontSize:9,color:"#f472b6" }}>■ PAS=Passive</span>
          </div>
        </div>
        <div style={{ width:1,background:"#0f172a",flexShrink:0 }}/>
        <div style={{ width:310,flexShrink:0,display:"flex",flexDirection:"column",overflow:"hidden" }}>
          <OracleTab activeClass={activeClass} isMobile={false}/>
        </div>
      </div>
    </div>
  );
}
