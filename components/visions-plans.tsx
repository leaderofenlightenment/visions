import { plans } from '@/lib/plans'

export function VisionsPlans({ onStart, onMaterials }: { onStart: () => void; onMaterials: () => void }) {
  return <section className="visions-plans" aria-label="VISIONS access plans">
    <div className="workspace-grid">
      {plans.map((plan, index) => <article key={plan.title} className="panel workspace-surface">
        <p className="eyebrow">{plan.price}</p>
        <h2>{plan.title}</h2><p>{plan.detail}</p><p className="muted">{plan.availability}</p>
        {index === 0 && <button className="primary-button" onClick={onStart}>Open VISIONS Core</button>}
        {index === 1 && <button className="secondary-button" onClick={onMaterials}>Open the Business workspace</button>}
      </article>)}
    </div>
    <p className="muted">Course and AI access are assigned by the owner. Online checkout is not available yet.</p>
  </section>
}
