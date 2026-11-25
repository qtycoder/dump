<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/helpers.php';

require_method('GET');
json_out(['user' => current_user()]);
