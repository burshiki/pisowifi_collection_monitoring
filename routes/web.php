<?php

use App\Http\Controllers\WifiVendoController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\OptionsController;
use App\Models\WifiVendo;
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
        // Get all vendos for audit
        $vendos = WifiVendo::all();
        
        return Inertia::render('audit-collections/index', [
            'vendos' => $vendos,
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
