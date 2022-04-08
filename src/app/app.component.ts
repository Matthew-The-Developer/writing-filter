import { Component } from '@angular/core';
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
  changes = 0;
  
  _posts = new BehaviorSubject<Post[]>([]);

  constructor() { }

  get posts$() {
    return this._posts.asObservable();
  }

  fileSelected(event: any) {
    if (event.target.files[0]) {
      this.loading = true;
      this.file = event.target.files[0];
      const fileReader = new FileReader();
      fileReader.readAsText(this.file!!, "UTF-8");
      fileReader.onload = () => {
        this.loading = false;
        const posts: Post[] = JSON.parse(fileReader.result as string);
        if (posts.length > 0) {
          this._posts.next(posts.map(post => this.scrubContent(post)));
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
    return { ...post, post_content: (temporalDivElement.textContent || temporalDivElement.innerText || "").replace(/\s*\[.*?\]\s*/g, '') };
  }

  deletePost(post: Post): void {
    const posts = this._posts.getValue();
    const index = posts.indexOf(post, 0);
    if (index > -1) {
      posts.splice(index, 1);
      this._posts.next(posts);
      this.changes++;
    }
  }
}
