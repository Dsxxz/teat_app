import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { BlogCreateDto } from './models/blogs.model.dto';
import { BlogService } from './blogs.service';
import { BlogsViewModel } from './models/blogs.view.model';
import { PostService } from '../posts/posts.service';
import {
  getPageInfo,
  InputQueryDto,
} from '../helpers/pagination/input.query.dto';
import { Paginator } from '../helpers/pagination/paginator';
import { BlogQueryRepo } from './blog.query.repo';
import { PostQueryRepo } from '../posts/posts.query.repo';
import { BasicAuthGuard } from '../auth/guards/basic.auth.guard';

@Controller('/blogs')
export class BlogsController {
  constructor(
    private blogService: BlogService,
    private postService: PostService,
    private blogQueryRepo: BlogQueryRepo,
    private postQueryRepo: PostQueryRepo,
  ) {}

  @Get(':id')
  async findOneBlog(@Param('id') id: string, @Res() res: Response) {
    const blog = await this.blogService.findOne(id);
    if (!blog) {
      return res.sendStatus(HttpStatus.NOT_FOUND);
    }
    return res.status(HttpStatus.OK).send(blog);
  }
  @Get()
  async findAllBlogs(@Query() dto: Partial<InputQueryDto>) {
    const pageInfo = getPageInfo(dto);
    const totalCount = await this.blogService.getTotalCount(dto.searchNameTerm);

    const blogs = await this.blogQueryRepo.findByQuery(
      pageInfo as InputQueryDto,
    );
    if (!blogs) {
      return Paginator.get({
        pageNumber: +pageInfo.pageNumber,
        pageSize: +pageInfo.pageSize,
        totalCount: +totalCount,
        items: [],
      });
    }

    return Paginator.get({
      pageNumber: +pageInfo.pageNumber,
      pageSize: +pageInfo.pageSize,
      totalCount: +totalCount,
      items: blogs,
    });
  }
  @Post()
  @UseGuards(BasicAuthGuard)
  async createBlog(@Body() dto: BlogCreateDto): Promise<BlogsViewModel> {
    return this.blogService.createBlog(dto);
  }

  @Put(':id')
  @HttpCode(204)
  @UseGuards(BasicAuthGuard)
  async updateBlog(
    @Param('id') id: string,
    @Body() dto: BlogCreateDto,
    @Res() res: Response,
  ) {
    const blog = await this.blogService.findBlogById(id);
    if (!blog) {
      return res.sendStatus(HttpStatus.NOT_FOUND);
    }
    await this.blogService.updateBlog(id, dto);
    return res.sendStatus(HttpStatus.NO_CONTENT);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  @UseGuards(BasicAuthGuard)
  async deleteBlog(@Param('id') id: string, @Res() res: Response) {
    const blog = await this.blogService.findBlogById(id);
    if (!blog) {
      return res.sendStatus(HttpStatus.NOT_FOUND);
    }
    await this.blogService.deleteBlog(id);
    return res.sendStatus(HttpStatus.NO_CONTENT);
  }

  @Post(':id/posts')
  @UseGuards(BasicAuthGuard)
  async createPostForBlog(
    @Param('id') id: string,
    @Body() dto: any,
    @Res() res: Response,
  ) {
    const foundBlog = await this.blogService.findBlogById(id);
    if (!foundBlog) {
      return res
        .status(HttpStatus.NOT_FOUND)
        .send([{ message: 'Blog must exist', field: 'blogId' }]);
    }
    const post = await this.postService.createPost({ ...dto, blogId: id });
    return res.send(post);
  }

  @Get(':id/posts')
  async findPostsForBlog(
    @Param('id') id: string,
    @Res() res: Response,
    @Query() dto: Partial<InputQueryDto>,
  ) {
    const blog = await this.blogService.findBlogById(id);
    if (!blog) {
      return res.sendStatus(HttpStatus.NOT_FOUND);
    }
    const pageInfo = getPageInfo(dto);
    const totalCount = await this.postService.getTotalCount(id);
    const posts = await this.postQueryRepo.findByQuery(
      pageInfo as InputQueryDto,
      id,
    );
    if (!posts) {
      return res.status(HttpStatus.OK).send(
        Paginator.get({
          pageNumber: +pageInfo.pageNumber,
          pageSize: +pageInfo.pageSize,
          totalCount: +totalCount,
          items: [],
        }),
      );
    }
    const result = posts.map((el) => {
      return {
        ...el,
        extendedLikesInfo: {
          likesCount: 0,
          dislikesCount: 0,
          myStatus: 'None',
          newestLikes: [],
        },
      };
    });
    res.status(HttpStatus.OK).send(
      Paginator.get({
        pageNumber: +pageInfo.pageNumber,
        pageSize: +pageInfo.pageSize,
        totalCount: +totalCount,
        items: result,
      }),
    );
  }
}
