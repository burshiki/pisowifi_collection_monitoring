<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreWifiVendoRequest;
use App\Http\Requests\UpdateWifiVendoRequest;
use App\Models\WifiVendo;
use Illuminate\Http\RedirectResponse;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Inertia\Inertia;
use Inertia\Response;

class WifiVendoController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:view wifi vendos', only: ['index']),
            new Middleware('permission:create wifi vendos', only: ['store']),
            new Middleware('permission:update wifi vendos|add wifi vendo collections|delete wifi vendo collections', only: ['update']),
            new Middleware('permission:delete wifi vendos', only: ['destroy']),
        ];
    }

    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $search = request('search');
        $status = request('status', 'all');
        
        $vendos = WifiVendo::query()
            ->when($search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->when($status !== 'all', function ($query) use ($status) {
                $currentMonth = now()->format('Y-m');
                
                if ($status === 'collected') {
                    // Has collection for current month
                    $query->whereNotNull('monthly_collections')
                        ->whereRaw("JSON_EXTRACT(monthly_collections, '$.\"" . $currentMonth . "\"') IS NOT NULL");
                } elseif ($status === 'not-collected') {
                    // No collection for current month and not new
                    $query->where(function ($q) use ($currentMonth) {
                        $q->whereNull('monthly_collections')
                            ->orWhereRaw("JSON_EXTRACT(monthly_collections, '$.\"" . $currentMonth . "\"') IS NULL");
                    })
                    ->where(function ($q) {
                        $q->whereYear('created_at', '!=', now()->year)
                            ->orWhereMonth('created_at', '!=', now()->month);
                    });
                } elseif ($status === 'new') {
                    // Created this month
                    $query->whereYear('created_at', now()->year)
                        ->whereMonth('created_at', now()->month);
                }
            })
            ->orderBy('name', 'desc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('wifi-vendos/index', [
            'vendos' => $vendos,
            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreWifiVendoRequest $request): RedirectResponse
    {
        WifiVendo::create($request->validated());

        return redirect()->route('wifi-vendos.index')->with('status', 'WiFi Vendo created successfully!');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateWifiVendoRequest $request, WifiVendo $wifiVendo): RedirectResponse
    {
        $wifiVendo->update($request->validated());

        // Check if request came from audit collections page
        $referer = $request->header('referer');
        if ($referer && str_contains($referer, 'audit-collections')) {
            return redirect()->route('audit-collections.index')->with('status', 'Collection confirmed successfully!');
        }

        return redirect()->route('wifi-vendos.index')->with('status', 'WiFi Vendo updated successfully!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(WifiVendo $wifiVendo): RedirectResponse
    {
        $wifiVendo->delete();

        return redirect()->route('wifi-vendos.index')->with('status', 'WiFi Vendo deleted successfully!');
    }
}
