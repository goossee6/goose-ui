export const FORM_KEY = Symbol('goose-form');
export const FORM_ITEM_KEY = Symbol('goose-form-item');

export interface FormContext {
	layout: 'horizontal' | 'vertical';
	labelWidth: string;
	disabled: boolean;
}

export interface FormItemContext {
	required: boolean;
	error: string;
	disabled: boolean;
}
