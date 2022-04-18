import { AfterViewInit, ChangeDetectorRef, Directive, ElementRef, Injector, Input } from '@angular/core';
import { ValidationErrors } from '@angular/forms';
import { MatFormField, MatFormFieldControl } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { startWith } from 'rxjs';
import { controlState } from '../models/control-state.enum';
import { errorMessages } from '../models/error-messages.const';

@Directive({
  selector: '[matErrors]'
})
export class MatErrorsDirective implements AfterViewInit {
  @Input() errorMessageOverride: { [key: string]: any } = {};
  private errorMessages: { [key: string]: any } = {};
  private inputRef: MatFormFieldControl<MatInput> | null = null;

  constructor(
    private elementRef: ElementRef,
    private injector: Injector,
    private changeDetectorRef: ChangeDetectorRef  
  ) { }
    
  ngAfterViewInit(): void {
    this.errorMessages = {
      ...errorMessages,
      ...this.errorMessageOverride
    }

    const container = this.injector.get<MatFormField>(MatFormField);
    this.inputRef = container._control;
    this.inputRef.ngControl?.statusChanges?.pipe(startWith(this.inputRef.ngControl.status)).subscribe(this.updateErrors);
  }

  private updateErrors = (state: controlState) => {
    if (state == controlState.Invalid) {
      const errors: ValidationErrors = this.inputRef?.ngControl?.errors!!;
      const firstError = Object.keys(errors)[0];
      if (this.errorMessages[firstError]) {
        this.elementRef.nativeElement.innerHTML = this.errorMessages[firstError];
      } else {
        this.elementRef.nativeElement.innerHTML = errors[firstError];
      }
      this.changeDetectorRef.detectChanges();
    }
  }
}
