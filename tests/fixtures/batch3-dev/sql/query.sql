SELECT p.payment_id, s.label
FROM payment p
JOIN payment_status s ON s.status_code = p.status_code
WHERE p.client_code = :clientCode
  AND s.active = 'Y';
