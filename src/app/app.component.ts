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
    const undos = this._undo.getValue();

    if (undos.length > 0) {
      const previous = undos[0];
      return Math.abs(previous.length - this._posts.getValue().length);
    } else {
      return 0;
    }
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

  update(posts: Post[]): void {
    const undos = this._undo.getValue();
    undos.push(this._posts.getValue());
    this._undo.next(undos);

    this._posts.next(posts);
    console.log(this._undo.getValue(), this._redo.getValue(), this._posts.getValue());
  }

  deletePost(deletedPost: Post): void {
    const posts = this._posts.getValue().filter(post => post != deletedPost);
    this.update(posts);
  }

  undo(): void {
    const undos = this._undo.getValue();
    const redos = this._redo.getValue();
    const posts = this._posts.getValue();
    const previous = undos.pop();
    redos.push(posts);
    this._undo.next(undos);
    this._redo.next(redos);

    this._posts.next(previous!!);

    console.log(this._undo.getValue(), this._redo.getValue(), this._posts.getValue());
  }

  redo(): void {
    const redos = this._redo.getValue();
    const undos = this._undo.getValue();
    const posts = this._posts.getValue();
    const previous = redos.pop();
    undos.push(posts);
    this._redo.next(redos);
    this._undo.next(undos);

    this._posts.next(previous!!);

    console.log(this._undo.getValue(), this._redo.getValue(), this._posts.getValue());
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
}
