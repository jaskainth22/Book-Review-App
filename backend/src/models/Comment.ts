import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  AllowNull,
  ForeignKey,
  BelongsTo,
  HasMany,
  Validate,
  AfterCreate,
  AfterDestroy,
} from 'sequelize-typescript'
import { User } from './User'
import { Review } from './Review'

@Table({
  tableName: 'comments',
  timestamps: true,
  indexes: [
    {
      name: 'idx_comments_review_id',
      fields: ['review_id'],
    },
    {
      name: 'idx_comments_user_id',
      fields: ['user_id'],
    },
    {
      name: 'idx_comments_parent_comment_id',
      fields: ['parent_comment_id'],
    },
    {
      name: 'idx_comments_created_at',
      fields: ['created_at'],
    },
  ],
})
export class Comment extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string

  @ForeignKey(() => Review)
  @AllowNull(false)
  @Column(DataType.UUID)
  reviewId!: string

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.UUID)
  userId!: string

  @AllowNull(false)
  @Validate({
    len: [1, 1000],
  })
  @Column(DataType.TEXT)
  content!: string

  @ForeignKey(() => Comment)
  @Column(DataType.UUID)
  parentCommentId?: string

  @Default(0)
  @Validate({
    min: 0,
  })
  @Column(DataType.INTEGER)
  likesCount!: number

  @BelongsTo(() => User)
  user!: User

  @BelongsTo(() => Review)
  review!: Review

  @BelongsTo(() => Comment, { foreignKey: 'parentCommentId' })
  parentComment?: Comment

  @HasMany(() => Comment, { foreignKey: 'parentCommentId' })
  replies!: Comment[]

  // Hooks to update review's comments count
  @AfterCreate
  @AfterDestroy
  static async updateReviewCommentsCount(instance: Comment): Promise<void> {
    const review = await Review.findByPk(instance.reviewId)
    if (review) {
      await review.updateCommentsCount()
    }
  }

  // Instance methods
  async getRepliesCount(): Promise<number> {
    const replies = await this.$get('replies')
    return replies ? replies.length : 0
  }

  async getNestedReplies(): Promise<Comment[]> {
    const replies = await Comment.findAll({
      where: { parentCommentId: this.id },
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'displayName', 'avatar'],
        },
        {
          model: Comment,
          as: 'replies',
          include: [
            {
              model: User,
              attributes: ['id', 'username', 'displayName', 'avatar'],
            },
          ],
        },
      ],
      order: [['createdAt', 'ASC']],
    })
    return replies
  }

  // Static validation methods
  static validateContent(content: string): boolean {
    return content.length >= 1 && content.length <= 1000
  }

  static validateCommentData(data: {
    content: string
    reviewId: string
    userId: string
    parentCommentId?: string
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!this.validateContent(data.content)) {
      errors.push('Comment content must be between 1 and 1000 characters')
    }

    if (!data.reviewId) {
      errors.push('Review ID is required')
    }

    if (!data.userId) {
      errors.push('User ID is required')
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  // Check if user can edit this comment
  canEdit(userId: string): boolean {
    return this.userId === userId
  }

  // Check if comment is a reply
  isReply(): boolean {
    return !!this.parentCommentId
  }

  // Get comment depth (for nested replies)
  async getDepth(): Promise<number> {
    if (!this.parentCommentId) return 0
    
    const parent = await Comment.findByPk(this.parentCommentId)
    if (!parent) return 0
    
    return (await parent.getDepth()) + 1
  }

  // Check if comment contains inappropriate content (basic implementation)
  containsInappropriateContent(): boolean {
    const inappropriateWords = [
      'spam', 'advertisement', 'buy now', 'click here',
      // Add more inappropriate words as needed
    ]
    
    const contentLower = this.content.toLowerCase()
    return inappropriateWords.some(word => contentLower.includes(word))
  }
}