'use client'

import type { Reponses, NatureProjetFR, TrancheBudgetFR, EmbauchePrevue, DepensesRD15Pct } from '@/types'
import { LABELS } from '@/lib/labels'

interface Props {
  reponses: Reponses
  onChange: (champ: keyof Reponses, valeur: unknown) => void
}

function RadioCard({ selected, label, onClick }: { selected: boolean; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`radio-card text-left${selected ? ' radio-card-active' : ''}`}>
      <span className="text-sm">{label}</span>
    </button>
  )
}

function BooleanToggle({ value, onChange, labelOui, labelNon }: {
  value: boolean | undefined
  onChange: (v: boolean) => void
  labelOui: string
  labelNon: string
}) {
  return (
    <div className="flex gap-2">
      <button type="button" onClick={() => onChange(true)}
        className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition ${value === true ? 'bg-corail text-white border-corail' : 'bg-white text-ardoise border-gray-200 hover:border-corail-clair'}`}>
        {labelOui}
      </button>
      <button type="button" onClick={() => onChange(false)}
        className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition ${value === false ? 'bg-corail text-white border-corail' : 'bg-white text-ardoise border-gray-200 hover:border-corail-clair'}`}>
        {labelNon}
      </button>
    </div>
  )
}

export default function WizardEtapeFR2({ reponses, onChange }: Props) {
  const anneeActuelle = new Date().getFullYear()

  // Création / amorçage : prêt bancaire prevu — affiché pour les créateurs récents
  const isCreationContext = reponses.nature_projet === 'creation_amorcage'
    || (reponses.annee_creation !== undefined && reponses.annee_creation >= anneeActuelle - 2)

  // R&D / innovation : questions JEI et deeptech — affiché pour les projets à contenu technologique
  const isRDContext = reponses.nature_projet === 'rd_verrous'
    || reponses.nature_projet === 'innovation_produit'

  // Numérotation dynamique de la section conditionnelle
  let qIdx = 16
  const pretQ = isCreationContext ? qIdx++ : null
  const rdPctQ = isRDContext ? qIdx++ : null
  const technoQ = isRDContext ? qIdx++ : null

  const showSection = isCreationContext || isRDContext

  return (
    <div className="space-y-8">
      <div>
        <p className="label mb-3">7. Nature du projet financé</p>
        <div className="grid grid-cols-1 gap-2">
          {(Object.entries(LABELS.nature_projet) as [NatureProjetFR, string][]).map(([k, v]) => (
            <RadioCard key={k} selected={reponses.nature_projet === k} label={v}
              onClick={() => onChange('nature_projet', k)} />
          ))}
        </div>
      </div>

      <div>
        <p className="label mb-3">8. Budget total du projet</p>
        <div className="grid grid-cols-2 gap-2">
          {(Object.entries(LABELS.budget_projet) as [TrancheBudgetFR, string][]).map(([k, v]) => (
            <RadioCard key={k} selected={reponses.budget_projet === k} label={v}
              onClick={() => onChange('budget_projet', k)} />
          ))}
        </div>
      </div>

      <div>
        <p className="label mb-3">9. Des dépenses ont-elles déjà été engagées sur ce projet ?</p>
        <BooleanToggle value={reponses.depenses_engagees}
          onChange={(v) => onChange('depenses_engagees', v)}
          labelOui="Oui, des dépenses déjà engagées"
          labelNon="Non, aucune dépense engagée" />
        {reponses.depenses_engagees === true && (
          <div className="mt-2 bg-amber-50 border border-amber-100 text-amber-700 rounded-xl p-3 text-xs">
            Attention : la plupart des aides Bpifrance (Bourse French Tech, ADI, i-Nov) n'acceptent que des dépenses <strong>postérieures</strong> au dépôt du dossier. Des dépenses déjà engagées réduisent votre éligibilité.
          </div>
        )}
      </div>

      <div>
        <p className="label mb-3">10. Votre entreprise dispose-t-elle d'un financement pour la part non-subventionnée ?</p>
        <BooleanToggle value={reponses.cofinancement_ok}
          onChange={(v) => onChange('cofinancement_ok', v)}
          labelOui="Oui, fonds propres ou emprunts disponibles"
          labelNon="Non, financement non encore sécurisé" />
      </div>

      <div>
        <p className="label mb-3">11. Personnel R&D dédié (chercheurs, techniciens de recherche)</p>
        <div className="grid grid-cols-2 gap-2">
          {(Object.entries(LABELS.personnel_rd) as [string, string][]).map(([k, v]) => (
            <RadioCard key={k} selected={reponses.personnel_rd === k} label={v}
              onClick={() => onChange('personnel_rd', k)} />
          ))}
        </div>
        <p className="text-xs text-ardoise-clair mt-1">Pertinent uniquement pour les demandes de CIR / CII.</p>
      </div>

      {/* Filtres catégories — 4 questions conditionnelles */}
      <div className="border-t border-gray-100 pt-6">
        <p className="text-xs font-medium text-ardoise-clair uppercase tracking-wider mb-4">
          Dimensions du projet — utilisées pour affiner vos résultats
        </p>

        <div className="space-y-5">
          <div>
            <p className="label mb-3">12. Prévoyez-vous d'embaucher dans les 12 prochains mois ?</p>
            <div className="grid grid-cols-1 gap-2">
              {(Object.entries(LABELS.embauche_prevue) as [EmbauchePrevue, string][]).map(([k, v]) => (
                <RadioCard key={k} selected={reponses.embauche_prevue === k} label={v}
                  onClick={() => onChange('embauche_prevue', k)} />
              ))}
            </div>
          </div>

          <div>
            <p className="label mb-3">13. Votre projet a-t-il une dimension export ou international ?</p>
            <BooleanToggle value={reponses.dimension_export}
              onChange={(v) => onChange('dimension_export', v)}
              labelOui="Oui — prospection, ventes à l'étranger"
              labelNon="Non, activité exclusivement France" />
          </div>

          <div>
            <p className="label mb-3">14. Votre projet a-t-il une dimension environnementale ?</p>
            <BooleanToggle value={reponses.dimension_ecologique}
              onChange={(v) => onChange('dimension_ecologique', v)}
              labelOui="Oui — énergie, décarbonation, déchets, biodiversité"
              labelNon="Non, pas de dimension environnementale" />
          </div>

          <div>
            <p className="label mb-3">15. Votre projet a-t-il une dimension numérique ?</p>
            <BooleanToggle value={reponses.dimension_numerique}
              onChange={(v) => onChange('dimension_numerique', v)}
              labelOui="Oui — site, logiciel, cybersécurité, IA"
              labelNon="Non, pas de dimension numérique" />
          </div>
        </div>
      </div>

      {/* Section conditionnelle : Création & R&D */}
      {showSection && (
        <div className="border-t border-gray-100 pt-6">
          <p className="text-xs font-medium text-ardoise-clair uppercase tracking-wider mb-4">
            Création & R&D — pour affiner votre éligibilité aux dispositifs ciblés
          </p>

          <div className="space-y-5">
            {pretQ !== null && (
              <div>
                <p className="label mb-3">{pretQ}. Avez-vous un prêt bancaire professionnel en cours de négociation ou prévu ?</p>
                <BooleanToggle value={reponses.pret_bancaire_prevu}
                  onChange={(v) => onChange('pret_bancaire_prevu', v)}
                  labelOui="Oui — prêt bancaire prévu ou en cours"
                  labelNon="Non, pas de prêt bancaire prévu" />
                <p className="text-xs text-ardoise-clair mt-1">
                  Pertinent pour la Garantie Création Bpifrance (couvre 50-60% du prêt).
                </p>
              </div>
            )}

            {rdPctQ !== null && (
              <div>
                <p className="label mb-1">{rdPctQ}. Vos dépenses de R&D représentent-elles au moins 15% de vos charges ?</p>
                <p className="text-xs text-ardoise-clair mb-3">
                  Critère clé pour le statut JEI (Jeune Entreprise Innovante) — dépenses R&D = salaires chercheurs, amortissements équipements R&D, sous-traitance agréée, brevets. À calculer avec votre expert-comptable.
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {(Object.entries(LABELS.depenses_rd_15pct) as [DepensesRD15Pct, string][]).map(([k, v]) => (
                    <RadioCard key={k} selected={reponses.depenses_rd_15pct === k} label={v}
                      onClick={() => onChange('depenses_rd_15pct', k)} />
                  ))}
                </div>
              </div>
            )}

            {technoQ !== null && (
              <div>
                <p className="label mb-1">{technoQ}. Votre technologie est-elle issue de travaux de recherche ou présente-t-elle des verrous scientifiques majeurs ?</p>
                <p className="text-xs text-ardoise-clair mb-3">
                  Requis pour les dispositifs deeptech Bpifrance (Bourse Emergence, Aide Deeptech, i-Lab) — technologie issue d'un labo, d'une thèse, d'un brevet ou présentant une rupture scientifique non résolue dans l'état de l'art.
                </p>
                <BooleanToggle value={reponses.techno_recherche}
                  onChange={(v) => onChange('techno_recherche', v)}
                  labelOui="Oui — technologie de rupture / issue de la recherche"
                  labelNon="Non — innovation incrémentale ou amélioration produit" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
