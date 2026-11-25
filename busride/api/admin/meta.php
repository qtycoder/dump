<?php
declare(strict_types=1);

require_once __DIR__ . '/../../includes/crud.php';

require_method('GET');
require_admin();

json_out(['entities' => crud_meta()]);
