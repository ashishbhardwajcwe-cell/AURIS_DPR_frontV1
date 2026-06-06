import { Fragment } from 'react';
import { formatDate } from '../lib/format.js';
import { colors, fonts, spacing } from '../styles/theme.js';

const SUBMITTED = 'submitted';
const IN_REVIEW = 'in_review';
const COMPLETED = 'completed';
const FAILED = 'failed';
const CANCELLED = 'cancelled';

function computeSteps(status, submittedAt, completedAt) {
  if (status === FAILED || status === CANCELLED) {
    return [
      { id: SUBMITTED, label: 'Submitted', date: submittedAt, done: true },
      {
        id: status,
        label: status === FAILED ? 'Failed' : 'Cancelled',
        date: completedAt,
        done: true,
        isTerminal: true,
        color:
          status === FAILED ? colors.statusFailed : colors.statusSubmitted,
      },
    ];
  }
  // Happy path: 3 steps.
  return [
    { id: SUBMITTED, label: 'Submitted', date: submittedAt, done: true },
    {
      id: IN_REVIEW,
      label: 'In Review',
      done: status === IN_REVIEW || status === COMPLETED,
      current: status === IN_REVIEW,
      color: colors.statusInReview,
    },
    {
      id: COMPLETED,
      label: 'Completed',
      date: completedAt,
      done: status === COMPLETED,
      current: status === COMPLETED,
      color: colors.statusCompleted,
    },
  ];
}

function Dot({ step }) {
  const ringColor = step.done
    ? step.color || colors.tealPrimary
    : '#CBD5E1';
  const fill = step.done ? ringColor : '#FFFFFF';
  const showRing = step.current && !step.isTerminal;

  return (
    <span
      aria-hidden="true"
      style={{
        position: 'relative',
        width: 28,
        height: 28,
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <span
        style={{
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: fill,
          border: `2px solid ${ringColor}`,
        }}
      />
      {showRing && (
        <span
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: `2px solid ${ringColor}`,
            opacity: 0.35,
            animation: 'auris-pulse 1.8s ease-out infinite',
          }}
        />
      )}
    </span>
  );
}

function Connector({ active }) {
  return (
    <span
      aria-hidden="true"
      style={{
        flex: 1,
        height: 2,
        background: active ? colors.tealPrimary : '#E2E8F0',
        margin: '0 4px',
        alignSelf: 'center',
        minWidth: 24,
      }}
    />
  );
}

export default function StatusTimeline({
  status,
  submittedAt,
  completedAt,
}) {
  const steps = computeSteps(status, submittedAt, completedAt);

  return (
    <div
      role="list"
      aria-label="Job progress"
      style={{
        display: 'flex',
        alignItems: 'stretch',
        gap: 0,
        marginTop: spacing.lg,
      }}
    >
      <style>{`@keyframes auris-pulse {
        0% { transform: scale(1); opacity: 0.4; }
        70% { transform: scale(1.8); opacity: 0; }
        100% { transform: scale(1.8); opacity: 0; }
      }`}</style>
      {steps.map((step, i) => (
        <Fragment key={step.id}>
          <div
            role="listitem"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              minWidth: 80,
            }}
          >
            <Dot step={step} />
            <span
              style={{
                fontFamily: fonts.body,
                fontSize: '12.5px',
                fontWeight: 600,
                color: step.done ? colors.textPrimary : colors.textMuted,
                textAlign: 'center',
              }}
            >
              {step.label}
            </span>
            <span
              style={{
                fontFamily: fonts.body,
                fontSize: '11.5px',
                color: colors.textMuted,
                textAlign: 'center',
                minHeight: 14,
              }}
            >
              {step.date ? formatDate(step.date) : ''}
            </span>
          </div>
          {i < steps.length - 1 && (
            <Connector active={steps[i + 1].done} />
          )}
        </Fragment>
      ))}
    </div>
  );
}
