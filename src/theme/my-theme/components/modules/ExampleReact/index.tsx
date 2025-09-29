import React, { useState } from 'react';
import {
  ModuleFields,
  RichTextField,
} from '@hubspot/cms-components/fields';
import { RichText } from '@hubspot/cms-components';
import styles from '../../../styles/example-react.module.css';

export function Component({ hublParameters }) {
  console.log('ExampleReact module mounted');
  const { brandColors } = hublParameters;
  const [showMore, setShowMore] = useState(false);

  return (
    <div
      className={styles.wrapper}
      style={{
        backgroundColor: brandColors?.color,
        opacity: brandColors?.opacity,
      }}
    >
      <RichText fieldPath="richText" />
      <button
        className={styles.button}
        onClick={() => {
          console.log('Button clicked, showMore:', !showMore);
          setShowMore(prev => !prev);
        }}
      >
        {showMore ? 'Hide' : 'See more'}
      </button>
      {showMore && (
        <div className={styles.moreContent}>
          More content.
        </div>
      )}
    </div>
  );
}

const richTextFieldDefaultValue = `
  <p>Example React Module.</p>
`;

export const fields = (
  <ModuleFields>
    <RichTextField
      name="richText"
      label="Rich Text"
      default={richTextFieldDefaultValue}
    />
  </ModuleFields>
);

export const meta = {
  label: 'Example React Module',
};
