import { Section } from '@northstar/shared';
import { JOINT_ACTIONS, NORTHSTAR_DEPENDENCIES, PILOT } from '../content';

export function NextStepsView() {
  return (
    <>
      <Section id="pilot" title={`Pilot: ${PILOT.brand}`} stack>
        <dl className="facts-card">
          <div>
            <dt>Window</dt>
            <dd>{PILOT.window}</dd>
          </div>
          <div>
            <dt>Why {PILOT.brand}</dt>
            <dd>{PILOT.why}</dd>
          </div>
        </dl>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Arm</th>
                <th>Set-up</th>
                <th>Purpose</th>
              </tr>
            </thead>
            <tbody>
              {PILOT.arms.map((a) => (
                <tr key={a.name}>
                  <td className="table__strong nowrap">{a.name}</td>
                  <td>{a.setup}</td>
                  <td>{a.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Success criterion</th>
                <th>Target</th>
              </tr>
            </thead>
            <tbody>
              {PILOT.criteria.map((c) => (
                <tr key={c.metric}>
                  <td className="table__strong">{c.metric}</td>
                  <td className="num">{c.target}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="table__caption">{PILOT.evidence}</p>
      </Section>

      <Section id="dependencies" title="What we need from Northstar" stack>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Owner</th>
                <th>Needed by</th>
              </tr>
            </thead>
            <tbody>
              {NORTHSTAR_DEPENDENCIES.map((d) => (
                <tr key={d.item}>
                  <td>{d.item}</td>
                  <td>{d.owner}</td>
                  <td className="num nowrap">{d.neededBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="actions" title="Joint next actions" stack>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Owner</th>
                <th>Due</th>
              </tr>
            </thead>
            <tbody>
              {JOINT_ACTIONS.map((a) => (
                <tr key={a.action}>
                  <td>{a.action}</td>
                  <td>{a.owner}</td>
                  <td className="num nowrap">{a.due}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </>
  );
}
