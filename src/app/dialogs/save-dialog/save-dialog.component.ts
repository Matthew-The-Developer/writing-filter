import { Component, Inject, OnInit } from '@angular/core';
import { AbstractControl, FormControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FileType } from 'src/app/models/file-type.enum';
import { Post } from 'src/app/models/post.model';

@Component({
  selector: 'app-save-dialog',
  templateUrl: './save-dialog.component.html',
  styleUrls: ['./save-dialog.component.scss']
})
export class SaveDialogComponent implements OnInit {
  posts: Post[] = [];
  fileName = new FormControl('', [
    Validators.required,
    this.forbiddenCharacterValidator(),
    this.dotStartValidator(), 
    this.forbiddenNameValidator()
  ]);
  fileType?: FileType;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<SaveDialogComponent>
  ) { }

  ngOnInit(): void {
    this.posts = this.data.posts;
  }

  save(): void {
    switch (this.fileType) {
      case FileType.JSON: {
        const payload = JSON.stringify(this.posts);
        let element = document.createElement('a');
        element.setAttribute('href', "data:text/json;charset=UTF-8," + encodeURIComponent(payload));
        element.setAttribute('download', `${this.fileName.value}.json`);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);

        this.dialogRef.close();
        break;
      }
      case FileType.TXT: {
        const payload = this.posts.map(post => `--- ${post.post_title} ---\n\n${post.post_content}`).join('\n\n');
        let element = document.createElement('a');
        element.setAttribute('href', "data:text/json;charset=UTF-8," + encodeURIComponent(payload));
        element.setAttribute('download', `${this.fileName.value}.txt`);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);

        this.dialogRef.close();
        break;
      }
    }
  }
  
  forbiddenCharacterValidator(): ValidatorFn {
    const forbiddenCharacters = /^[^\\/:\*\?"<>\|]+$/;
    return (control: AbstractControl): ValidationErrors | null => {
      const fileName = control.value;
      return !forbiddenCharacters.test(fileName)? { forbiddenCharacter: 'Cannot include : * ? " < > |' } : null;
    }
  }

  dotStartValidator(): ValidatorFn {
    const dotStart = /^\./;
    return (control: AbstractControl): ValidationErrors | null => {
      const fileName = control.value;
      return dotStart.test(fileName)? { dotStart: 'Cannot start with .' } : null;
    }
  }

  forbiddenNameValidator(): ValidatorFn {
    const forbiddenNames = /^(nul|prn|con|lpt[0-9]|com[0-9])(\.|$)/i;
    return (control: AbstractControl): ValidationErrors | null => {
      const fileName = control.value;
      return forbiddenNames.test(fileName)? { forbiddenName: 'Forbidden Name' } : null;
    }
  }
}
