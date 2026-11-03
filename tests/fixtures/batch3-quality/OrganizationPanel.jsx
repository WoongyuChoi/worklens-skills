// 합성 자료: 실제 서버·사내 화면이 아닙니다.
import React, {useEffect, useState} from 'react';

export function OrganizationPanel({organization, period, client}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => {
    setLoading(true);
    setError(null);
    client.list({organization, period})
      .then(response => setRows(response.rows))
      .catch(failure => setError(failure.message))
      .finally(() => setLoading(false));
  }, [organization, period, client]);
  return <section aria-label="조직별 조회">
    {loading && <p>조회 중</p>}
    {error && <p role="alert">{error}</p>}
    <ul>{rows.map(row => <li key={row.id}>{row.name}</li>)}</ul>
  </section>;
}
