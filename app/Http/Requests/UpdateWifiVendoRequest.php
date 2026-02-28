<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateWifiVendoRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('wifi_vendos')->ignore($this->wifi_vendo)],
            'remarks' => ['nullable', 'string', 'max:500'],
            'monthly_collections' => ['nullable', 'array'],
            'deleted_month_key' => ['nullable', 'string'],
            'deletion_remarks' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.unique' => 'A WiFi vendo with this name already exists. Please use a different name.',
        ];
    }
}
