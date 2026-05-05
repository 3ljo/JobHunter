'use client';

import GenericRenderer, { type ThemeTokens } from './GenericRenderer';
import type { TemplateProps } from './types';

const SERIF = "'Garamond','Georgia','Times New Roman',serif";
const SERIF2 = "'Cormorant Garamond','Georgia',serif";
const SANS = "'Inter','Segoe UI',Arial,sans-serif";
const MONO = "'JetBrains Mono','SF Mono',Consolas,monospace";

const make = (theme: ThemeTokens) => {
  const Component = (props: TemplateProps) => <GenericRenderer {...props} theme={theme} />;
  return Component;
};

/* ── Industry-specific (12) ─────────────────────────────────────────────── */
export const NursingCare = make({ primary: '#9f1239', accent: '#fb7185', fontFamily: SANS, headerStyle: 'centered', sectionStyle: 'rule', skillStyle: 'pills', tagline: 'Registered Nurse' });
export const UniversityFaculty = make({ primary: '#14532d', accent: '#92400e', fontFamily: SERIF, headerStyle: 'centered', sectionStyle: 'plain', skillStyle: 'inline', tagline: 'University Faculty', baseSize: 14 });
export const DentalPractice = make({ primary: '#0d9488', accent: '#86efac', fontFamily: SANS, headerStyle: 'left', sectionStyle: 'rule', skillStyle: 'pills', tagline: 'Dental Practitioner' });
export const SolicitorUK = make({ primary: '#7f1d1d', accent: '#a16207', fontFamily: SERIF, headerStyle: 'centered', sectionStyle: 'rule', skillStyle: 'inline', tagline: 'Solicitor' });
export const LawEnforcement = make({ primary: '#1e3a8a', accent: '#fbbf24', fontFamily: SANS, headerStyle: 'band', sectionStyle: 'rule', skillStyle: 'plain', tagline: 'Public Safety' });
export const MilitaryVeteran = make({ primary: '#365314', accent: '#a3a380', fontFamily: SANS, headerStyle: 'centered', sectionStyle: 'rule', skillStyle: 'plain', tagline: 'Veteran' });
export const AviationPilot = make({ primary: '#1e293b', accent: '#cbd5e1', fontFamily: SANS, headerStyle: 'band', sectionStyle: 'rule', skillStyle: 'plain', tagline: 'Aviation' });
export const CulinaryChef = make({ primary: '#451a03', accent: '#dc2626', fontFamily: SERIF2, headerStyle: 'centered', sectionStyle: 'plain', skillStyle: 'inline', tagline: 'Culinary Professional', baseSize: 14 });
export const FitnessTrainer = make({ primary: '#0a0a0a', accent: '#f97316', fontFamily: SANS, headerStyle: 'band', sectionStyle: 'tab', skillStyle: 'pills', tagline: 'Strength · Conditioning' });
export const NgoFieldWorker = make({ primary: '#92400e', accent: '#fbbf24', fontFamily: SANS, headerStyle: 'left', sectionStyle: 'plain', skillStyle: 'pills', tagline: 'NGO · Field Programs' });
export const TranslatorLinguist = make({ primary: '#3730a3', accent: '#fcd34d', fontFamily: SANS, headerStyle: 'left', sectionStyle: 'rule', skillStyle: 'pills', tagline: 'Translator · Linguist' });
export const AccountantCPA = make({ primary: '#14532d', accent: '#bef264', fontFamily: SANS, headerStyle: 'centered', sectionStyle: 'rule', skillStyle: 'plain', tagline: 'Certified Public Accountant' });

/* ── Color / aesthetic (15) ────────────────────────────────────────────── */
export const ArcticMinimal = make({ primary: '#0c4a6e', accent: '#7dd3fc', fontFamily: SANS, headerStyle: 'left', sectionStyle: 'plain', skillStyle: 'inline', bg: '#f0f9ff' });
export const TerracottaEarth = make({ primary: '#92400e', accent: '#fdba74', fontFamily: SERIF2, headerStyle: 'centered', sectionStyle: 'plain', skillStyle: 'pills', bg: '#fef9f3' });
export const LavenderCalm = make({ primary: '#5b21b6', accent: '#c4b5fd', fontFamily: SANS, headerStyle: 'left', sectionStyle: 'rule', skillStyle: 'pills' });
export const EmeraldLuxe = make({ primary: '#065f46', accent: '#fbbf24', fontFamily: SERIF, headerStyle: 'band', sectionStyle: 'rule', skillStyle: 'plain' });
export const SapphireRoyal = make({ primary: '#1e3a8a', accent: '#94a3b8', fontFamily: SERIF, headerStyle: 'band', sectionStyle: 'block', skillStyle: 'plain' });
export const PlumModern = make({ primary: '#86198f', accent: '#fda4af', fontFamily: SANS, headerStyle: 'left', sectionStyle: 'rule', skillStyle: 'pills' });
export const MustardBold = make({ primary: '#854d0e', accent: '#1e3a8a', fontFamily: SANS, headerStyle: 'band', sectionStyle: 'tab', skillStyle: 'pills' });
export const SeafoamCoastal = make({ primary: '#0f766e', accent: '#fde68a', fontFamily: SANS, headerStyle: 'centered', sectionStyle: 'plain', skillStyle: 'pills', bg: '#f0fdfa' });
export const RoseElegant = make({ primary: '#9f1239', accent: '#f5d0c0', fontFamily: SERIF, headerStyle: 'centered', sectionStyle: 'plain', skillStyle: 'inline' });
export const CoalIndustrial = make({ primary: '#1f2937', accent: '#94a3b8', fontFamily: MONO, headerStyle: 'left', sectionStyle: 'tab', skillStyle: 'pills' });
export const ForestDeep = make({ primary: '#14532d', accent: '#a3e635', fontFamily: SANS, headerStyle: 'left', sectionStyle: 'rule', skillStyle: 'pills' });
export const CrimsonPower = make({ primary: '#7f1d1d', accent: '#fecaca', fontFamily: SANS, headerStyle: 'band', sectionStyle: 'rule', skillStyle: 'plain' });
export const MochaWarm = make({ primary: '#451a03', accent: '#92400e', fontFamily: SERIF, headerStyle: 'centered', sectionStyle: 'plain', skillStyle: 'inline', bg: '#fdf6e3' });
export const CobaltTech = make({ primary: '#1e40af', accent: '#fbbf24', fontFamily: MONO, headerStyle: 'band', sectionStyle: 'tab', skillStyle: 'pills' });
export const AshQuiet = make({ primary: '#404040', accent: '#a3a3a3', fontFamily: SANS, headerStyle: 'left', sectionStyle: 'plain', skillStyle: 'inline' });

/* ── Style / mood (15) ─────────────────────────────────────────────────── */
export const RetroEighties = make({ primary: '#86198f', accent: '#06b6d4', fontFamily: MONO, headerStyle: 'band', sectionStyle: 'block', skillStyle: 'pills' });
export const ModernistBold = make({ primary: '#0a0a0a', accent: '#dc2626', fontFamily: SANS, headerStyle: 'band', sectionStyle: 'tab', skillStyle: 'pills' });
export const UltraMinimal = make({ primary: '#0a0a0a', accent: '#9ca3af', fontFamily: SANS, headerStyle: 'left', sectionStyle: 'plain', skillStyle: 'inline' });
export const CoolGradient = make({ primary: '#1e40af', accent: '#a78bfa', fontFamily: SANS, headerStyle: 'band', sectionStyle: 'rule', skillStyle: 'pills' });
export const ChromeMetal = make({ primary: '#1a1a1a', accent: '#9ca3af', fontFamily: MONO, headerStyle: 'band', sectionStyle: 'tab', skillStyle: 'pills' });
export const PastoralCountry = make({ primary: '#78350f', accent: '#d6c8a3', fontFamily: SERIF2, headerStyle: 'centered', sectionStyle: 'plain', skillStyle: 'inline', bg: '#fef9e7', baseSize: 14 });
export const ZenJapandi = make({ primary: '#3f2a14', accent: '#a8a29e', fontFamily: SERIF2, headerStyle: 'centered', sectionStyle: 'plain', skillStyle: 'inline', bg: '#fafaf9', baseSize: 14 });
export const IndustrialSteel = make({ primary: '#27272a', accent: '#f97316', fontFamily: SANS, headerStyle: 'band', sectionStyle: 'tab', skillStyle: 'pills' });
export const PaperbackNovel = make({ primary: '#451a03', accent: '#92400e', fontFamily: SERIF, headerStyle: 'left', sectionStyle: 'rule', skillStyle: 'inline', bg: '#f5e6c4', baseSize: 14 });
export const MidnightBlue = make({ primary: '#0c1d3d', accent: '#22d3ee', fontFamily: SANS, headerStyle: 'band', sectionStyle: 'block', skillStyle: 'pills' });
export const CoralCalm = make({ primary: '#9a3412', accent: '#fed7aa', fontFamily: SANS, headerStyle: 'centered', sectionStyle: 'plain', skillStyle: 'pills' });
export const AshFog = make({ primary: '#475569', accent: '#cbd5e1', fontFamily: SANS, headerStyle: 'left', sectionStyle: 'plain', skillStyle: 'pills' });
export const GoldRoyal = make({ primary: '#0a0a0a', accent: '#d4af37', fontFamily: SERIF, headerStyle: 'centered', sectionStyle: 'rule', skillStyle: 'inline' });
export const ScarletPro = make({ primary: '#dc2626', accent: '#fef3c7', fontFamily: SANS, headerStyle: 'band', sectionStyle: 'rule', skillStyle: 'plain' });
export const TealClean = make({ primary: '#0f766e', accent: '#a7f3d0', fontFamily: SANS, headerStyle: 'left', sectionStyle: 'rule', skillStyle: 'pills' });

/* ── Final mix (8) ─────────────────────────────────────────────────────── */
export const NavyCoral = make({ primary: '#1e3a8a', accent: '#f87171', fontFamily: SANS, headerStyle: 'left', sectionStyle: 'rule', skillStyle: 'pills' });
export const BronzeWarm = make({ primary: '#78350f', accent: '#fcd34d', fontFamily: SERIF, headerStyle: 'centered', sectionStyle: 'plain', skillStyle: 'inline' });
export const VioletElegant = make({ primary: '#6b21a8', accent: '#cbd5e1', fontFamily: SANS, headerStyle: 'left', sectionStyle: 'rule', skillStyle: 'pills' });
export const OrangeBold = make({ primary: '#27272a', accent: '#f97316', fontFamily: SANS, headerStyle: 'band', sectionStyle: 'block', skillStyle: 'pills' });
export const CharcoalSerif = make({ primary: '#1f2937', accent: '#9ca3af', fontFamily: SERIF, headerStyle: 'centered', sectionStyle: 'plain', skillStyle: 'inline' });
export const MaroonClassic = make({ primary: '#7f1d1d', accent: '#a16207', fontFamily: SERIF, headerStyle: 'centered', sectionStyle: 'plain', skillStyle: 'inline', bg: '#fffbeb' });
export const JadeNatural = make({ primary: '#047857', accent: '#a7f3d0', fontFamily: SANS, headerStyle: 'left', sectionStyle: 'rule', skillStyle: 'pills' });
export const SilverElite = make({ primary: '#1f2937', accent: '#cbd5e1', fontFamily: SANS, headerStyle: 'band', sectionStyle: 'rule', skillStyle: 'pills' });
