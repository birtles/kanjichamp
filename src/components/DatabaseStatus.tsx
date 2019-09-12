import { h, FunctionalComponent, JSX } from 'preact';

import { DatabaseVersion } from '../common';
import { DatabaseState } from '../database';
import { DB_LANGUAGES, DB_LANGUAGE_NAMES } from '../db-languages';
import { CloneableUpdateState } from '../update-state';

type Props = {
  databaseState: DatabaseState;
  databaseVersions: {
    kanjidb?: DatabaseVersion;
    bushudb?: DatabaseVersion;
  };
  updateState: CloneableUpdateState;
  onUpdate?: () => void;
  onCancel?: () => void;
  onDestroy?: () => void;
  onSetLang?: (lang: string) => void;
};

export const DatabaseStatus: FunctionalComponent<Props> = (props: Props) => {
  let versionLabel = null;
  if (props.databaseVersions.kanjidb) {
    const { major, minor, patch } = props.databaseVersions.kanjidb;
    versionLabel = (
      <div className="version-label">{`${major}.${minor}.${patch}`}</div>
    );
  }

  return (
    <div className="database-status">
      <h2 className="header">Kanji database{versionLabel}</h2>
      {renderBody(props)}
    </div>
  );
};

function renderBody(props: Props) {
  const { databaseState, updateState } = props;
  if (databaseState === DatabaseState.Initializing) {
    return <div class="status-line">Initializing&hellip;</div>;
  }

  switch (updateState.state) {
    case 'idle': {
      let status;
      if (databaseState === DatabaseState.Empty) {
        status = 'No database';
      } else if (updateState.lastCheck) {
        status = `Up-to-date. Last check ${formatDate(updateState.lastCheck)}.`;
      } else {
        status = 'Up-to-date.';
      }

      return (
        <div>
          {renderDatabaseSummary(props)}
          <div class="status-with-button">
            <div class="status-line">{status}</div>
            {renderLangSelector(props)}
            <button class="primary" onClick={props.onUpdate}>
              Check for updates
            </button>
          </div>
        </div>
      );
    }

    case 'checking':
      return (
        <div class="status-with-button">
          <div class="status-line">Checking for updates&hellip;</div>
          <button onClick={props.onCancel}>Cancel</button>
        </div>
      );

    case 'downloading': {
      const { major, minor, patch } = updateState.downloadVersion;
      const { progress } = updateState;
      const label = `Downloading version ${major}.${minor}.${patch} (${Math.round(
        progress * 100
      )}%)`;
      return (
        <div class="status-with-button">
          <div class="details">
            <div class="overlaid-progress progress">
              <progress max="100" value={progress * 100} id="update-progress" />
              <label for="update-progress">{label}&hellip;</label>
            </div>
          </div>
          <button onClick={props.onCancel}>Cancel</button>
        </div>
      );
    }

    case 'updatingdb': {
      const { major, minor, patch } = updateState.downloadVersion;
      const label = `Updating database to version ${major}.${minor}.${patch}`;
      return (
        <div class="status-with-button">
          <div class="details">
            <div class="overlaid-progress progress">
              <progress id="update-progress" />
              <label for="update-progress">{label}&hellip;</label>
            </div>
          </div>
          <button disabled>Cancel</button>
        </div>
      );
    }

    case 'error':
      return (
        <div>
          {renderDatabaseSummary(props)}
          <div class="status-with-button error">
            <div class="error-message">
              Update failed: {updateState.error.message}
            </div>
            <button class="primary" onClick={props.onUpdate}>
              Retry
            </button>
          </div>
        </div>
      );
  }

  return null;
}

function renderDatabaseSummary(props: Props): JSX.Element | null {
  if (!props.databaseVersions.kanjidb) {
    return null;
  }

  const kanjiDbVersion = props.databaseVersions.kanjidb;

  return (
    <div class="database-summary">
      Includes data from{' '}
      <a
        href="https://www.edrdg.org/wiki/index.php/KANJIDIC_Project"
        target="_blank"
      >
        KANJIDIC
      </a>{' '}
      version {kanjiDbVersion.databaseVersion} generated on{' '}
      {kanjiDbVersion.dateOfCreation}. This data is the property of the{' '}
      <a href="https://www.edrdg.org/" target="_blank">
        Electronic Dictionary Research and Development Group
      </a>
      , and is used in conformance with the Group's{' '}
      <a href="https://www.edrdg.org/edrdg/licence.html" target="_blank">
        licence
      </a>
      .
    </div>
  );
}

function renderLangSelector(props: Props): JSX.Element {
  const selectedLang = props.databaseVersions.kanjidb
    ? props.databaseVersions.kanjidb.lang
    : 'en';

  return (
    <select
      name="lang"
      class="lang-selector"
      onChange={evt => {
        if (evt && evt.target && props.onSetLang) {
          props.onSetLang((evt.target as HTMLSelectElement).value);
        }
      }}
    >
      {DB_LANGUAGES.map(lang => (
        <option value={lang} selected={lang === selectedLang}>
          {DB_LANGUAGE_NAMES.get(lang)!}
        </option>
      ))}
    </select>
  );
}

// Our special date formatting that is a simplified ISO 8601 in local time
// without seconds.
function formatDate(date: Date): string {
  const pad = (n: number) => (n < 10 ? '0' + n : n);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
