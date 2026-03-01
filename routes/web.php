<?php

use App\Http\Controllers\WifiVendoController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\OptionsController;
use App\Models\WifiVendo;
use Carbon\Carbon;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('login');
})->name('home');

Route::get('dashboard', function () {
    $vendos = WifiVendo::all();
    
    return Inertia::render('dashboard', [
        'vendos' => $vendos,
    ]);
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('wifi-vendos', WifiVendoController::class);
    Route::resource('users', UserController::class)->except(['show', 'create', 'edit']);
    Route::resource('activity-logs', ActivityLogController::class)->only(['index', 'show'])->middleware('permission:view activity logs');
    
    Route::get('audit-collections', function () {
        // Get query parameters
        $search = request('search');
        $status = request('status', 'all');
        $confirmationDate = request('confirmation_date');
        
        // Get all vendos for audit
        $query = WifiVendo::query();
        
        // Search by name
        if ($search) {
            $query->where('name', 'like', "%{$search}%");
        }
        
        $vendos = $query->get();
        
        // Filter by status (server-side)
        // Check the latest collection month per vendo, not just the current month,
        // so unconfirmed collections from previous months still show as pending.
        if ($status !== 'all') {
            $vendos = $vendos->filter(function ($vendo) use ($status) {
                $collections = $vendo->monthly_collections ?? [];

                // Find latest month with an unconfirmed collection
                $hasCollection = false;
                $isConfirmed = false;
                $months = array_keys($collections);
                rsort($months);

                foreach ($months as $month) {
                    $data = $collections[$month];
                    $amt = is_array($data) ? ($data['amount'] ?? 0) : ($data ?? 0);
                    if ($amt > 0) {
                        $hasCollection = true;
                        $isConfirmed = is_array($data) && isset($data['confirmed_amount']);
                        break; // use the latest month with a collection
                    }
                }

                if ($status === 'confirmed') {
                    return $hasCollection && $isConfirmed;
                } elseif ($status === 'pending') {
                    return $hasCollection && !$isConfirmed;
                } elseif ($status === 'not-collected') {
                    return !$hasCollection;
                }

                return true;
            })->values();
        }
        
        return Inertia::render('audit-collections/index', [
            'vendos' => $vendos,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'confirmation_date' => $confirmationDate,
            ],
        ]);
    })->name('audit-collections.index')->middleware('permission:view audit collections');
    
    // Options routes (Admin only)
    Route::middleware('permission:manage system options')->prefix('options')->name('options.')->group(function () {
        Route::get('/', [OptionsController::class, 'index'])->name('index');
        Route::post('/settings', [OptionsController::class, 'updateSettings'])->name('update-settings');
        Route::delete('/logo', [OptionsController::class, 'removeLogo'])->name('remove-logo');
        Route::get('/backup', [OptionsController::class, 'backup'])->name('backup');
        Route::post('/restore', [OptionsController::class, 'restore'])->name('restore');
        Route::get('/backups/list', [OptionsController::class, 'listBackups'])->name('backups.list');
        Route::get('/backups/{filename}', [OptionsController::class, 'downloadBackup'])->name('backups.download');
        Route::delete('/backups/{filename}', [OptionsController::class, 'deleteBackup'])->name('backups.delete');
    });
});

require __DIR__.'/settings.php';
