const ALARM_CODE_TEXT = `
A1 ALLERGIE
A1 ALPIN
A1 BEREIT
A1 BRAND
A1 CHIR
A1 COVID
A1 EINGESCHLOSSEN
A1 EINSTURZ
A1 EXPLOSION
A1 GEFAHRGUT
A1 GEWALT
A1 GYN
A1 HÖHLE_GRUBE
A1 INTERN
A1 INTOX
A1 KRANK
A1 NEURO
A1 POLIZEI
A1 PSYCH
A1 RUFHILFE
A1 SONST
A1 STILLER NOTRUF
A1 STILL
A1 STROM
A1 TRAUMA
A1 VERKEHR
A1 VERKEHR_LUFT
A1 VERKEHR_SCHIENE
A1 VERSCHÜTTUNG
A1 WASSER
A3 ALLERGIE
A3 ALPIN
A3 BEREIT
A3 BRAND
A3 CHIR
A3 COVID
A3 EINGESCHLOSSEN
A3 EINSTURZ
A3 EXPLOSION
A3 GEFAHRGUT
A3 GEWALT
A3 GYN
A3 HÖHLE_GRUBE
A3 INTERN
A3 INTOX
A3 KRANK
A3 NEURO
A3 POLIZEI
A3 PSYCH
A3 RUFHILFE
A3 SONST
A3 STILLER NOTRUF
A3 STILL
A3 STROM
A3 TRAUMA
A3 VERKEHR
A3 VERKEHR_LUFT
A3 VERKEHR_SCHIENE
A3 VERSCHÜTTUNG
A3 WASSER
A4 ALLERGIE
A4 ALPIN
A4 BEREIT
A4 BRAND
A4 CHIR
A4 COVID
A4 EINGESCHLOSSEN
A4 EINSTURZ
A4 EXPLOSION
A4 GEFAHRGUT
A4 GEWALT
A4 GYN
A4 HÖHLE_GRUBE
A4 INTERN
A4 INTOX
A4 KRANK
A4 NEURO
A4 POLIZEI
A4 PSYCH
A4 RUFHILFE
A4 SONST
A4 STILLER NOTRUF
A4 STILL
A4 STROM
A4 TRAUMA
A4 VERKEHR
A4 VERKEHR_LUFT
A4 VERKEHR_SCHIENE
A4 VERSCHÜTTUNG
A4 WASSER
A2 ALLERGIE
A2 ALPIN
A2 CHIR
A2 FACHANFORDERUNG
A2 GYN
A2 HÖHLE_GRUBE
A2 INTERN
A2 INTOX
A2 NEURO
A2 STILL
A2 STROM
A2 TRAUMA
B1 ALLERGIE
B1 ALPIN
B1 BEREIT
B1 BRAND
B1 CHIR
B1 COVID
B1 EINGESCHLOSSEN
B1 EINSTURZ
B1 EXPLOSION
B1 FACHANFORDERUNG
B1 GEFAHRGUT
B1 GEWALT
B1 GYN
B1 HILFE
B1 INTERN
B1 INTOX
B1 KRANK
B1 NEURO
B1 POLIZEI
B1 PSYCH
B1 RUFHILFE
B1 SONST
B1 STROM
B1 TRAUMA
B1 UNKLAR
B1 VERKEHR
B1 VERKEHR_LUFT
B1 VERKEHR_SCHIENE
B1 WASSER
B2 ALLERGIE
B2 ALPIN
B2 BEREIT
B2 BRAND
B2 CHIR
B2 COVID
B2 EINGESCHLOSSEN
B2 EINSTURZ
B2 EXPLOSION
B2 FACHANFORDERUNG
B2 GEFAHRGUT
B2 GEWALT
B2 GYN
B2 HILFE
B2 INTERN
B2 INTOX
B2 KRANK
B2 NEURO
B2 POLIZEI
B2 PSYCH
B2 RUFHILFE
B2 SONST
B2 STROM
B2 TRAUMA
B2 UNKLAR
B2 VERKEHR
B2 VERKEHR_LUFT
B2 VERKEHR_SCHIENE
B2 WASSER
B3 ALLERGIE
B3 ALPIN
B3 BEREIT
B3 CHIR
B3 COVID
B3 FACHANFORDERUNG
B3 GEWALT
B3 GYN
B3 HILFE
B3 INTERN
B3 INTOX
B3 KRANK
B3 NEURO
B3 POLIZEI
B3 PSYCH
B3 RUFHILFE
B3 SONST
B3 STROM
B3 TRAUMA
B3 UNKLAR
B3 VERZÖGERT
B4 ALLERGIE
B4 ALPIN
B4 BEREIT
B4 CHIR
B4 COVID
B4 FACHANFORDERUNG
B4 GEWALT
B4 GYN
B4 HILFE
B4 INTERN
B4 INTOX
B4 KRANK
B4 NEURO
B4 POLIZEI
B4 PSYCH
B4 RUFHILFE
B4 SONST
B4 STROM
B4 TRAUMA
B4 UNKLAR
B4 VERZÖGERT
C1 INTERHOSP
C2 INTERHOSP
C2 INKUBATOR
C3 INTERHOSP_BD
C3 INTERHOSP
C3 INKUBATOR
C4 GEHEND
C4 SITZEND
C4 LIEGEND
C4 GEHEND_BD
C4 SITZEND_BD
C4 LIEGEND_BD
D1 AMB
D1 COV_IMPFEN
D1 COVID
D1 DIALYSE
D1 EINWEISUNG
D1 FERN
D1 HEIM
D1 INFEKTION
D1 PRIO
D1 SCHWER
D1 STAT
D2 AMB
D2 COV_IMPFEN
D2 COVID
D2 DIALYSE
D2 EINWEISUNG
D2 FERN
D2 HEIM
D2 INFEKTION
D2 PRIO
D2 SCHWER
D2 STAT
D3 AMB
D3 COV_IMPFEN
D3 COVID
D3 DIALYSE
D3 EINWEISUNG
D3 FERN
D3 HEIM
D3 INFEKTION
D3 PRIO
D3 SCHWER
D3 STAT
D4 AMB
D4 COV_IMPFEN
D4 COVID
D4 DIALYSE
D4 EINWEISUNG
D4 FERN
D4 HEIM
D4 INFEKTION
D4 PRIO
D4 SCHWER
D4 STAT
D5 AMB
D5 COV_IMPFEN
D5 COVID
D5 DIALYSE
D5 EINWEISUNG
D5 FERN
D5 HEIM
D5 INFEKTION
D5 PRIO
D5 SCHWER
D5 STAT
E1 KIT_LWZ
E1 KIT_RK
E1 KIT_VERTRAG
E2 BLUT_ORGAN
E2 BLUT_ORGAN_BD
E2 COVID AVT
E2 COVID AVT DRV
E2 COVID AVT STA
E2 COVID GESU
E2 COVID GESU DRV
E2 COVID GESU STA
E2 COVID KP
E2 COVID KP DRV
E2 COVID KP STA
E2 COVID PROBE
E2 COVID PROBE DRV
E2 COVID PROBE STA
E2 COVID REISE
E2 COVID RK
E2 COVID RK VD
E2 COVID_STUDIE
E3 ARZT
E3 ARZT MIT NAH
E3 ARZT_BD
E4 ALARMSYSTEM
E4 AMBULANZ
E4 DIENST
E4 GERÄTE
E4 HITT
E4 O2
E4 SONDERLEISTUNG
E4 SUCHAKTION
E4 TEST
E4 TEST_BD
E4 ÜBUNG
E4 COV DIENST
E4 COVID TEST
E4 DRIVEIN
E4 STATIONÄR
E5 ABFRAGE
E5 APOTHEKE
E5 BEAUSKUNFTUNG
E5 BEHÖRDE ARZT
E5 RÜCKRUF
E5 SONST
E5 TELEMEDIZIN
E5 TODESFESTSTELL
E5 ÜBERGABE_RD
E5 VISITENARZT
E5 VISITENARZT_FA
`;

const PZC_TEXT = `
211 Polytrauma mit SHT
212 Polytrauma ohne SHT
210 sonstige kombinierte Verletzungen
221 Schädelhirntrauma (SHT) offen
222 Schädelhirntrauma (SHT) geschlossen
214 Gesichts-/Kopfverletzung (außer Kopfplatzwunde)
215 Gesichts-/Kopfverletzung mit Augenbeteiligung
216 Gesichts-/Kopfverletzung mit HNO oder MKG-Beteiligung
231 Thoraxverletzung penetrierend
232 Thoraxverletzung geschlossen/stumpf
230 sonstige thoraxchirurgische Verletzungen
241 Abdomenverletzung penetrierend
242 Abdomenverletzung geschlossen/stumpf
243 Akutes Abdomen (nicht traumatisch)
244 V. a. Blinddarmentzündung
240 sonstige bauchchirurgische Notfälle
261 Beckenverletzung penetrierend
262 Beckenverletzung geschlossen/stumpf
234 Riss-, Quetsch-, Schnitt-, Stich-, Kopfplatzwunde
235 Bisswunde
236 Dekubitus
251 Wirbelsäulentrauma mit neurolog. Ausfällen
252 Wirbelsäulentrauma ohne neurolog. Ausfälle
253 Wirbelsäule/Bandscheibe nicht traumatisch mit neurolog. Ausfällen
254 Wirbelsäule/Bandscheibe nicht traumatisch ohne neurolog. Ausfälle
270 sonstige kombinierte Extremitätenverletzungen
271 Extremitätenfraktur offen
272 Extremitätenfraktur geschlossen
273 Schenkelhalsfraktur
274 Gelenksluxation
278 Extremitäten-Amputation
279 Extremitäten Verstauchung, Zerrung, Prellung
125 Reanimation nicht traumatisch
131 Reanimation traumatisch
411 Krampfanfall bei bekanntem Krampfleiden
412 erstmaliger Krampfanfall
413 Kopfschmerz
414 unklare Bewusstlosigkeit
415 Verwirrtheit (neu aufgetreten)
416 akuter Schwindel
410 sonstige neurologische Erkrankungen
421 Insult/TIA/Blutung < 6 h
422 Insult/TIA/Blutung 6-24 h
423 Insult/TIA/Blutung > 24 h
275 sonstige Handverletzung
276 Hand-Amputation
277 Finger-Amputation
282 Verätzung (äußerlich)
283 Blitzschlag/Hochspannungstrauma
284 Verbrennung/Verbrühung 1. Grades
285 Verbrennung/Verbrühung 2. Grades oder 3. Grades
291 Extremitätenverletzung mit Gefäß-/ Nervenbeteiligung
292 Aortenaneurysma
293 Extremität kühl, pulslos
294 Extremität gerötet und überwärmt
290 sonstige gefäßchirurgische Notfälle
305 Atemstillstand oder Atemfrequenz < 6/min
306 Atemnot mit Sauerstoffsättigung < 90%
307 Atemnot mit Sauersoffsättigung 90 - 95%
308 Allergische Reaktion mit Atemnot
312 Asthma/COPD
313 Bluthusten
314 Bolusgeschehen/Aspiration
315 Atemwegsinfekt
316 Hyperventilation
317 Rauchgas-/Reizgasexposition (keine CO-Intoxikation)
319 (Beinahe-) Ertrinken
310 sonstige respiratorische Erkrankungen
321 Allergische Reaktion
322 Synkope/Kollaps
323 Hypertonie
324 Hypotonie
325 Thrombose
326 Fieber
327 Hitzeerschöpfung/Hitzschlag
328 Unterkühlung/Erfrierung
329 Exsikkose
320 sonstige internistische Erkrankungen
331 Herzinfarkt < 12h (EKG gesichert)
332 Herzinfarkt > 12h (EKG gesichert)
333 Akutes Koronarsyndrom (ACS)
334 Brustschmerz, kardial
335 Brustschmerz, nicht kardial
341 Arrhythmie/Rhythmusstörungen
344 Elektrounfall (Niederspannung)
348 Herzinsuffizienz/Lungenödem
349 Lungenembolie
351 Bluterbrechen
352 rektaler Blutabgang/Teerstuhl
353 Unklares Abdomen (nicht chirurgisch)
354 Durchfall
355 Übelkeit, Erbrechen
356 Verätzung/Stoff geschluckt (innerlich)
357 Kolik (nicht Nierenkolik)
350 sonstige gastroenterologische Erkrankungen
392 Hyperglykämie
393 Hypoglykämie
371 Definierte Infektionskrankheit
372 Meningitis
373 Tuberkulose (TBC)
374 septischer Schock
370 sonstige infektiologische Erkrankungen
376 COVID-19 Verdacht
377 COVID-19 Positiv
279 (V. a.) hochansteckende Erkrankung
361 Alkoholintoxikation
362 Drogenintoxikation
363 Mischintoxikation Alkohol/Drogen/Medikamente
364 Lebensmittelintoxikation
365 Medikamentenintoxikation
366 Pflanzenschutzmittelintoxikation
367 Tierische Gift-/ Giftpflanzenintoxikation
368 Intoxikation mit Agitation
360 sonstige Intoxikationen
431 Suizidversuch (drohend)
434 Psychiatrische Einweisung
436 Psychiatrischer Ausnahmezustand
437 Psychiatrische Einweisung n. § 8 UBG weiblich
438 Psychiatrische Einweisung n. § 8 UBG männlich
430 sonstige psychiatrische Erkrankungen
511 Pädiatrie - Atemnot
512 Krupp/Pseudokrupp
513 Pädiatrie - Fieberkrampf
514 Pädiatrie - Epilepsie
521 beginnende Entbindung / Wehentätigkeit / Blasensprung < 36 SSW
522 beginnende Entbindung / Wehentätigkeit / Blasensprung >= 36 SSW
524 Präklinische Geburt >= 36 SSW
525 Präklinische Frühgeburt < 36 SSW
526 Eklampsie
527 Vaginale Blutung während Schwangerschaft > 36 SSW
529 Vaginale Blutung während Schwangerschaft 22-36 SSW
534 Vaginale Blutung während Schwangerschaft < 22 SSW
520 sonstige Schwangerschaftsprobleme
761 CO- (Kohlenmonoxid-)Vergiftung
762 Dekompressionskrankheit
763 Gasbrand/Gasödem
531 Vaginale Blutung
532 Unterbauchschmerzen
533 Sexualdelikt
530 sonstige gynäkologische Erkrankung
703 Haut- und Geschlechtskrankheit
711 Flankenschmerz/Nieren-/Harnleiterkolik
712 Hoden-/Penisschmerz
713 Harnverhalt
714 Blut im Harn
715 Katheterwechsel/Katheterproblem
717 Harnwegsinfekt
718 isoliertes Trauma im Genitalbereich (männlich)
719 isoliertes Trauma im Genitalbereich (weiblich)
710 sonstige urologische Erkrankungen
721 Augenverletzung mit Fremdkörper
722 Augenverletzung ohne Fremdkörper
723 Akute Augenerkrankung/Schmerzen/Rötung
724 Augenverletzung durch Chemikalien
725 akute Sehstörung/Sehverlust
720 sonstige augenheilkundliche Erkrankungen
731 Akutes Nasenbluten
732 Barotrauma
733 Hörsturz
734 postoperative Nachblutung
735 Fremdkörper in Ohr/Nase
736 Tinnitus
730 sonstige HNO-Erkrankungen
741 ZMK-Erkrankung
751 Strahlenexposition
`;

function inferAutoLights(code) {
  return /^(A|B)[1-4]\b/.test(code) || /MANV|NOTRUF|TRAUMA|VERKEHR|REANIMATION|EINSTURZ|EXPLOSION/.test(code);
}

window.ALARM_CODES = ALARM_CODE_TEXT.trim().split('\n').map((line) => ({ code: line.trim(), autoLights: inferAutoLights(line.trim()) }));
window.PZC_CODES = PZC_TEXT.trim().split('\n').map((line) => {
  const firstSpace = line.indexOf(' ');
  return { code: line.slice(0, firstSpace), diagnosis: line.slice(firstSpace + 1) };
});
