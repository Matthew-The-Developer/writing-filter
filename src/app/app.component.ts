import { Component } from '@angular/core';
import { _closeDialogVia } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject } from 'rxjs';
import { Post } from './models/post.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'Written To File';
  file: File | null = null;
  loading = false;
  error = false;
  
  _posts = new BehaviorSubject<Post[]>([]);
  _undo = new BehaviorSubject<Post[][]>([]);
  _redo = new BehaviorSubject<Post[][]>([]);

  constructor(
    private snackbarService: MatSnackBar
  ) { }

  get posts$() {
    return this._posts.asObservable();
  }

  get changes() {
    return Math.abs(this._undo.getValue().length - this._posts.getValue().length);
  }

  get undoable() {
    return this._undo.getValue().length > 0;
  }

  get redoable() {
    return this._redo.getValue().length > 0;
  }

  get saveTip() {
    return this.changes > 0 ? `${this.changes} Unsaved Changes` : 'Save';
  }

  update(posts: Post[]) {
    const undos = this._undo.getValue();
    undos.push(this._posts.getValue());
    this._undo.next(undos);

    this._posts.next(posts);
  }

  fileSelected(event: any) {
    if (event.target.files[0]) {
      this.loading = true;
      this.file = event.target.files[0];
      const fileReader = new FileReader();
      fileReader.readAsText(this.file!!, "UTF-8");
      fileReader.onload = () => {
        this.loading = false;
        let posts: Post[] = JSON.parse(fileReader.result as string);
        if (posts.length > 0) {
          posts = posts.map(post => this.scrubContent(post));
          this._posts.next(posts);

          this.update(this.scrubPosts(posts));

          if (this.changes > 0) {
            this.snackbarService.open(
              `${this.changes} Duplicate & Empty Posts Removed`,
              'Dismiss',
              { duration: 4000 }
            );
          }
        }
      }
      fileReader.onerror = (error) => {
        this.loading = false;
        console.log(error);
      }
    }
  }

  scrubContent(post: Post): Post {
    var temporalDivElement = document.createElement("div");
    temporalDivElement.innerHTML = post.post_content;
    return { 
      ...post, 
      post_content: (temporalDivElement.textContent || temporalDivElement.innerText || "").replace(/\s*\[.*?\]\s*/g, '')
    };
  }

  scrubPosts(posts: Post[]): Post[] {
    return posts
      .filter((value, index, self) => index === self.findIndex(post => post.post_content === value.post_content))
      .filter(post => post.post_content);
  }

  deletePost(post: Post): void {
    const posts = this._posts.getValue();
    const index = posts.indexOf(post, 0);
    if (index > -1) {
      posts.splice(index, 1);
      this._posts.next(posts);
    }
  }
}
