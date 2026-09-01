/**
 * Standing non-affiliation notice.
 *
 * This is an independent case study that references a real product and a real fraud. It is not
 * connected to either company, and it must never be mistaken for something they published. The
 * notice is persistent rather than tucked into a corner for that reason.
 */

export function Disclaimer() {
  return (
    <footer className="disclaimer">
      <p className="disclaimer__strong">
        Independent case study. Not affiliated with, endorsed by, or connected to Yape or BCP.
      </p>
      <p>
        A front-end demonstration built against fabricated fixtures. No real payment, account, or
        ledger is involved, and no real payment can be verified here.
      </p>
      <p>
        Visual treatment follows an <strong>approximate</strong> palette and type reference derived
        from screen inspection for the case study — not from any published design system, and not a
        reproduction of any real product.
      </p>
    </footer>
  );
}
