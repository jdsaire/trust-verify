/**
 * Provenance badging.
 *
 * This build contains two kinds of claim and they must never be read as one kind:
 *
 *  - SIMULATED — a security pattern demonstrated in the interface against fabricated fixtures.
 *    The pattern is the deliverable; the values are staged. Nothing here measures anything.
 *  - IMPLEMENTED — a control that genuinely runs in this app's client code and can be exercised.
 *
 * Every claim is routed through this component, so no simulated value can reach the screen as an
 * unqualified statement of fact. The two kinds are also kept in separate panels rather than
 * interleaved, so the segregation is structural and not only a matter of labelling.
 */

export type ClaimProvenance = 'simulated' | 'implemented';

const COPY: Record<ClaimProvenance, { label: string; title: string }> = {
  simulated: {
    label: 'SIMULATED',
    title:
      'Demonstrated against fabricated fixtures. Not a real credential, connection, or measurement.',
  },
  implemented: {
    label: 'IMPLEMENTED',
    title: 'A control that genuinely runs in this app’s client code.',
  },
};

export function ProvenanceBadge({ provenance }: { provenance: ClaimProvenance }) {
  const { label, title } = COPY[provenance];
  return (
    <span className={`badge badge--${provenance}`} title={title}>
      {label}
    </span>
  );
}
