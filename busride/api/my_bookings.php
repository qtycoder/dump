<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/bookings.php';

require_method('GET');
$user = require_login();
$pdo  = db();

$bookings = load_bookings($user['id']);

$stats = ['upcoming' => 0, 'past' => 0, 'paid_total' => 0.0, 'due_total' => 0.0];
$next  = null;
foreach ($bookings as $b) {
    if ($b['status'] !== 'confirmed') {
        continue;
    }
    if ($b['upcoming']) {
        $stats['upcoming']++;
        if ($b['payment_status'] === 'unpaid') {
            $stats['due_total'] += $b['amount'];
        }
        // rows are newest-first, so the last upcoming one we see is the soonest
        $next = $b;
    } else {
        $stats['past']++;
    }
    if ($b['payment_status'] === 'paid') {
        $stats['paid_total'] += $b['amount'];
    }
}
$stats['paid_total'] = money($stats['paid_total']);
$stats['due_total']  = money($stats['due_total']);

// Paid amount per month for the last 6 months (including this one).
$thisMonth = (string) $pdo->query("SELECT DATE_FORMAT(NOW(), '%Y-%m')")->fetchColumn();
$months = [];
[$y, $m] = array_map('intval', explode('-', $thisMonth));
for ($i = 5; $i >= 0; $i--) {
    $mm = $m - $i;
    $yy = $y;
    while ($mm < 1) { $mm += 12; $yy--; }
    $months[sprintf('%04d-%02d', $yy, $mm)] = 0.0;
}

$q = $pdo->prepare("
  SELECT DATE_FORMAT(created_at, '%Y-%m') AS ym, SUM(amount) AS total
    FROM bookings
   WHERE user_id = ? AND status = 'confirmed' AND payment_status = 'paid'
   GROUP BY ym");
$q->execute([$user['id']]);
foreach ($q->fetchAll() as $row) {
    if (isset($months[$row['ym']])) {
        $months[$row['ym']] = (float) $row['total'];
    }
}
$monthly = [];
foreach ($months as $ym => $total) {
    $monthly[] = ['month' => $ym, 'total' => money($total)];
}

json_out(['bookings' => $bookings, 'stats' => $stats, 'next' => $next, 'monthly' => $monthly]);
