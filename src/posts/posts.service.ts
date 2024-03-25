import { Inject, Injectable } from '@nestjs/common';
import { PostRepository } from './posts.repository';
import { PostsModelDto } from './models/posts.model.dto';
import { BlogService } from '../blogs/blogs.service';
import { PostModel } from './models/posts.model';
import { InputQueryDto } from '../pagination/input.query.dto';
import { PostViewModel } from './models/post.view.model';
import { LikeEnum } from '../likes/likes_models/likes.enum.model';

@Injectable()
export class PostService {
  constructor(
    @Inject(PostRepository) private readonly postRepository: PostRepository,
    protected blogService: BlogService,
  ) {}
  async findPostById(id: string) {
    const post = await this.postRepository.findPostById(id);
    if (!post) return null;
    return {
      id: post.id,
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId,
      blogName: post.blogName,
      createdAt: post.createdAt,
      extendedLikesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: 'None',
        newestLikes: [],
      },
    };
  }

  async findAllPosts() {
    return this.postRepository.findAllPosts();
  }

  async createPost(dto: PostsModelDto): Promise<PostViewModel> {
    const blog = await this.blogService.findBlogById(dto.blogId);
    if (!blog) throw new Error('Blog must exist');
    const post = await this.postRepository.createPost(dto, blog.name);
    return {
      id: post.id,
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId,
      blogName: post.blogName,
      createdAt: post.createdAt,
      extendedLikesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: LikeEnum.None,
        newestLikes: [],
      },
    };
  }

  async updatePost(id: string, dto: PostsModelDto) {
    return this.postRepository.updatePost(id, dto);
  }

  async findPostsForBlogBiId(id: string): Promise<any | null> {
    return this.postRepository.findPostsForBlogBiId(id);
  }

  async findByQuery(dto: InputQueryDto): Promise<PostViewModel[]> {
    const posts = await this.postRepository.findByQuery(dto);
    if (!posts) return [];
    return posts.map((post) => {
      return {
        id: post.id,
        title: post.title,
        shortDescription: post.shortDescription,
        content: post.content,
        blogId: post.blogId,
        blogName: post.blogName,
        createdAt: post.createdAt,
        extendedLikesInfo: {
          likesCount: 0,
          dislikesCount: 0,
          myStatus: LikeEnum.None,
          newestLikes: [],
        },
      };
    });
  }
}
